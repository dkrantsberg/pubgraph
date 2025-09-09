import neo4j, { Driver } from 'neo4j-driver';

/**
 * Shape of a single triple produced by the LLM.
 */
export interface Triple {
  subject: string;
  subject_type: string;
  subject_qualifier: string[] | null;
  object: string;
  object_type: string;
  object_qualifier: string[] | null;
  relationship: string;
  statement_qualifier: string[] | string | null;
}

/**
 * Service responsible for writing triples to Neo4j.
 */
export default class Neo4jService {
  private driver: Driver;

  constructor(
    uri: string = process.env.NEO4J_URI || 'neo4j+s://<host>',
    user: string = process.env.NEO4J_USER || 'neo4j',
    password: string = process.env.NEO4J_PASSWORD || 'changeme',
  ) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  /**
   * Sanitise relationship strings so they can be used as Neo4j relationship type names.
   */
  private static sanitiseRelationship(rel: string): string {
    return rel.replace(/[^A-Za-z0-9]/g, '_').toUpperCase();
  }

  async ingestTriples(triples: Triple[]): Promise<void> {
    const session = this.driver.session();
    try {
      for (const t of triples) {
        const relType = Neo4jService.sanitiseRelationship(t.relationship);
        try {
          await session.writeTransaction((tx) =>
            tx.run(
              `MERGE (s:Entity {name: $sName})
               ON CREATE SET s.type = $sType
               MERGE (o:Entity {name: $oName})
               ON CREATE SET o.type = $oType
               MERGE (s)-[r:${relType}]->(o)
               ON CREATE SET r.subject_qualifier = $subQual,
                             r.object_qualifier  = $objQual,
                             r.statement_qualifier = $stmtQual,
                             r.source = $source`,
              {
                sName: t.subject,
                sType: t.subject_type ?? null,
                oName: t.object,
                oType: t.object_type ?? null,
                subQual: t.subject_qualifier ?? null,
                objQual: t.object_qualifier ?? null,
                stmtQual: t.statement_qualifier ?? null,
                source: 'LLM_PubGraph',
              },
            ),
          );
        } catch (err) {
          console.error(`Failed to ingest triple (${t.subject} -[${relType}]-> ${t.object}):`, err);
          // skip this triple and continue with others
        }
      }
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    await this.driver.close();
  }
}
