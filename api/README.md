# PubGraph – Knowledge Graph Extraction Pipeline

PubGraph is a TypeScript pipeline that converts unstructured biomedical publication data into a structured knowledge graph.  
It ingests **titles** and **abstracts** from CSV files, extracts semantic triples with the help of an LLM hosted on **AWS Bedrock**, and persists the triples as first-class relationships in **Neo4j**.

---

## Table of Contents
1.  Overview
2.  Features
3.  Architecture
4.  Quick Start
5.  Configuration
6.  Usage
7.  Triple Schema
8.  Project Structure
9.  Development & Testing
10.  Roadmap
11.  License

---

## 1. Overview
Scientific papers contain rich relationships between genes, proteins, chemicals, diseases and more, but the knowledge is locked inside free-text. PubGraph automates the extraction process:

1. Read publication metadata (title, abstract) from a CSV dataset.
2. Ask an LLM to return core triples in **JSON-Lines** format.
3. Convert the triples into nodes and relationships.
4. Store them in Neo4j so they can be queried with Cypher.

The heart of the system is `src/pipeline.ts`; everything else (Bedrock & Neo4j services) is a thin, typed wrapper around external APIs.

---

## 2. Features
* **Language-model extraction** – Uses Anthropic Claude Sonnet (or any other Bedrock model) to identify subjects, predicates and objects.
* **Strict typing** – End-to-end TypeScript with explicit `Triple` interface.
* **Graph persistence** – Each triple is mapped to `(Subject)-[PREDICATE]->(Object)` in Neo4j.
* **Pluggable components** – Swap LLM provider or database by replacing the service classes.
* **Streaming-friendly** – The pipeline processes records sequentially, allowing huge datasets without high memory usage.

---

## 3. Architecture
```text
+---------------+     prompt      +------------------+
|   CSV Source  | ───────────────►|  BedrockService  |
+---------------+                 +------------------+
        │                                   │  JSON-Lines triples
        │ records                            ▼
        │                           +------------------+
        └──────────────────────────►|   pipeline.ts    |
                                    +------------------+
                                            │ Triple[]
                                            ▼
                                   +------------------+
                                   |  Neo4jService    |
                                   +------------------+
                                            │
                                            ▼
                                   +------------------+
                                   |   Neo4j Graph    |
                                   +------------------+
```

---

## 4. Quick Start
### Prerequisites
* Node.js >= 18
* An AWS account with Bedrock access to your chosen model (default: Claude Sonnet-4).
* A running Neo4j instance (local, Docker, Aura, …).

### Installation
```bash
# clone and enter repository
$ git clone <repo-url>
$ cd pubgraph/api

# install dependencies
$ npm install
```

### Environment
Copy the example file and fill in your credentials:
```bash
$ cp .env.example .env
```
Required variables:
* `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
* `BEDROCK_MODEL_ID` – e.g. `us.anthropic.claude-sonnet-4-20250514-v1:0`
* `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`

### Run the Pipeline
```bash
# process default sample CSV
$ npm run pipeline           # alias for ts-node src/pipeline.ts

# or specify a custom file
$ npm run pipeline -- path/to/your.csv
```
After completion the triples are visible in Neo4j Browser via a query like:
```cypher
MATCH (s)-[r]->(o) RETURN s, r, o LIMIT 100;
```

---

## 5. Configuration
All options are `.env` driven. The most common ones are listed here:
| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | Region for Bedrock client | `us-east-1` |
| `BEDROCK_MODEL_ID` | Model ID to invoke | `us.anthropic.claude-sonnet-4-20250514-v1:0` |
| `NEO4J_URI` | Bolt/S scheme | `neo4j+s://<host>` |
| `NEO4J_USER` | Database username | `neo4j` |
| `NEO4J_PASSWORD` | Database password | `password` |
| `LOG_LEVEL` | Console verbosity | `info` |

---

## 6. Usage
The npm script simply forwards params to `pipeline.ts`:
```bash
npm run pipeline -- [csvPath]
```
Inside the code:
```typescript
await runPipeline('data/publications.csv');
```

* The CSV **must** contain at least `PublicationTitle` and `Abstract` columns.
* Each record is logged as it is processed.
* Malformed JSON lines from the LLM are skipped with a warning.

---

## 7. Triple Schema
```typescript
interface Triple {
  subject: string;
  subject_type: string;              // e.g. "gene", "disease", ...
  subject_qualifier: string[] | null;
  object: string;
  object_type: string;
  object_qualifier: string[] | null;
  relationship: string;              // free text (sanitised for Neo4j)
  statement_qualifier: string[] | string | null;
}
```
In Neo4j each triple becomes:
```text
(:Entity { name: subject, type: subject_type })
-[:RELATIONSHIP { ...qualifiers }]->
(:Entity { name: object, type: object_type })
```

---

## 8. Project Structure
```text
api/
├── src/
│   ├── pipeline.ts           # main entry point
│   ├── services/
│   │   ├── bedrock-service.ts  # LLM wrapper
│   │   └── neo4j-service.ts    # graph persistence
│   ├── data/
│   │   └── publications.csv    # sample dataset
│   └── types/                  # shared typings
├── dist/                      # compiled JS output
├── package.json
└── README.md                  # you are here
```

---

## 9. Development & Testing
* **Dev run**: `npm run dev:ts` – executes with ts-node & hot reload.
* **Static type check**: `npm run type-check`.
* **ESLint / Prettier**: `npm run lint` / `npm run format`.
* **Unit tests**: Coming soon (Jest + ts-jest).

---

## 10. Roadmap
* Batch/parallel record processing.
* Automatic entity disambiguation & synonyms.
* Stream output directly into graph to reduce memory footprint.
* Add tests and CI pipeline.

---

## 11. License
ISC