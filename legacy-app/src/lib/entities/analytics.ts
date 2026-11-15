"use client";
import { useMemo } from "react";
import { useEntity } from "./EntityContext";
import type { Entity, EntityType, RelationshipType } from "./types";

/**
 * Relationship Analytics Engine
 * Master Specification: Analytics Engine
 *
 * Calculates insights dynamically from the entity/relationship graph.
 */

export function useGraphAnalytics() {
  const { entities, relationships } = useEntity();

  return useMemo(() => {
    const entityList = Array.from(entities.values());
    const totalEntities = entityList.length;
    const totalRelationships = relationships.length;

    // Entities by type
    const entitiesByType = {} as Record<EntityType, number>;
    for (const e of entityList) {
      entitiesByType[e.entityType] = (entitiesByType[e.entityType] || 0) + 1;
    }

    // Relationships by type
    const relationshipsByType = {} as Record<RelationshipType, number>;
    for (const r of relationships) {
      relationshipsByType[r.type] = (relationshipsByType[r.type] || 0) + 1;
    }

    // Connection count per entity
    const connectionCounts = new Map<string, number>();
    for (const r of relationships) {
      connectionCounts.set(r.sourceId, (connectionCounts.get(r.sourceId) || 0) + 1);
      connectionCounts.set(r.targetId, (connectionCounts.get(r.targetId) || 0) + 1);
    }

    const averageConnections = totalEntities > 0
      ? (Array.from(connectionCounts.values()).reduce((s, c) => s + c, 0) / totalEntities)
      : 0;

    // Most connected entities
    const mostConnected = Array.from(connectionCounts.entries())
      .map(([id, count]) => {
        const e = entities.get(id);
        return { entityId: id, name: e?.displayName || "Unknown", connectionCount: count };
      })
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 10);

    return {
      totalEntities,
      totalRelationships,
      entitiesByType,
      relationshipsByType,
      averageConnections,
      mostConnected,
      activeEntities: entityList.filter((e) => e.status === "active").length,
      verifiedEntities: entityList.filter((e) => e.status === "verified").length,
    };
  }, [entities, relationships]);
}

/**
 * Relationship path finder (BFS shortest path)
 * Master Specification: Graph Structure — Fast traversal, shortest paths
 */
export function findShortestPath(
  relationships: { sourceId: string; targetId: string }[],
  fromId: string,
  toId: string
): string[] | null {
  if (fromId === toId) return [fromId];

  const visited = new Set<string>([fromId]);
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    const neighbors = relationships
      .filter((r) => r.sourceId === id || r.targetId === id)
      .map((r) => (r.sourceId === id ? r.targetId : r.sourceId));

    for (const neighbor of neighbors) {
      if (neighbor === toId) return [...path, neighbor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return null;
}

/**
 * Find all entities within N hops of a given entity
 * Master Specification: Neighborhood searches
 */
export function findNeighborhood(
  relationships: { sourceId: string; targetId: string }[],
  centerId: string,
  maxHops: number
): { entityId: string; hops: number }[] {
  const result: { entityId: string; hops: number }[] = [{ entityId: centerId, hops: 0 }];
  const visited = new Map<string, number>([[centerId, 0]]);
  let frontier = [centerId];

  for (let hop = 1; hop <= maxHops; hop++) {
    const next: string[] = [];
    for (const id of frontier) {
      const neighbors = relationships
        .filter((r) => r.sourceId === id || r.targetId === id)
        .map((r) => (r.sourceId === id ? r.targetId : r.sourceId));

      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.set(n, hop);
          result.push({ entityId: n, hops: hop });
          next.push(n);
        }
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }

  return result;
}
