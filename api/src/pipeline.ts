import BedrockService from './services/bedrock-service.js';
import Neo4jService, { Triple } from './services/neo4j-service.js';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({path: path.join(import.meta.dirname, '../.env') });


/**
 * Builds the prompt instructing the LLM to return only JSON triples.
 */
function buildPrompt(title: string, abstract: string): string {
  return `
You are a medical researcher. Complete the following tasks.

First, read the title and abstract from a scientific journal below and report a short summary of the main findings of the paper.
Title: ${title}
Abstract: ${abstract}


Return core triples from the title and abstract you read in. Select the subjects and objects for these core triples from the entities you listed. 
If additional information is needed for context, add that information in the qualifiers. If there are no qualifiers, write null instead. 
For sequence variants or mutations, the related gene should be added to the qualifier.

Here is an example of the expected output format:
{"subject":"Adolescents", "subject_type":"Other", "subject_qualifier":["post-molar extraction", "Adolescents = 15", "Age (years) = 15-17"], "object":"Opioid", "object_type":"Chemical", "object_qualifier":null, "relationship":"taken", "statement_qualifier":["two days post extraction"]}
{"subject":"interventions", "subject_type":"Other", "subject_qualifier":["non-pharmacological"], "object":"symptoms", "object_type":"Disease", "object_qualifier":["pain related", "psychological"], "relationship":"useful in treating", "statement_qualifier":["may","cancer patients"]}

The allowed values for subject_type and object_type are: [organism, event, procedure, device, chemical, treatment, food, biological process, gene, protein, sequence variant, mutation, disease, phenotype, anatomical entity, cell, cohort, pathway, physiological process, behavior, location, other]
  
Return ONLY the triple JSON lines without any extra text or formatting.`;
}

async function runPipeline(csvPath: string): Promise<void> {
  const bedrock = new BedrockService();
  const neo4jSvc = new Neo4jService();

  try {
    const csvContent = await fs.readFile(path.join(import.meta.dirname, csvPath), 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    console.log(`Starting pipeline with ${records.length} records to process`);
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record) continue;
      
      const title = record.PublicationTitle || '';
      const abstract = record.Abstract || '';
      
      console.log(`Processing record ${i + 1}/${records.length}: "${title.substring(0, 80)}${title.length > 80 ? '...' : ''}"`);
      
      const prompt = buildPrompt(title, abstract);
      const llmOutput = await bedrock.callModel(prompt);

      // Parse each JSON line into Triple objects
      const triples: Triple[] = llmOutput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line) as Triple;
          } catch (err) {
            console.warn(`Skipping malformed JSON line: ${line}`);
            return null;
          }
        })
        .filter(Boolean) as Triple[];

      if (triples.length) {
        await neo4jSvc.ingestTriples(triples);
        console.log(`Ingested ${triples.length} triples for record`);
      } else {
        console.warn('No triples extracted for record');
      }
    }
    
    console.log(`Processed ${records.length} records.`);
  } finally {
    await neo4jSvc.close();
  }
}

// Execute when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const CSV_PATH = process.argv[2] || 'data/publications.csv';
  runPipeline(CSV_PATH).catch((err) => {
    console.error('Pipeline failed:', err);
    process.exit(1);
  });
}
