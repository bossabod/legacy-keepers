"use client";
import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import type { Entity, BaseEntity, EntityType, Relationship, TimelineEvent, RelationshipType } from "./types";

/**
 * Entity Engine — CRUD Operations
 * Master Specification: Entity System, Universal Entity Architecture
 *
 * Provides:
 * - Entity creation, reading, updating, deletion
 * - Relationship creation and removal
 * - Timeline event logging
 * - Tag management
 * - Custom field support
 */

interface EntityState {
  entities: Map<string, Entity>;
  relationships: Relationship[];
  timeline: TimelineEvent[];

  // CRUD
  createEntity: (data: Partial<BaseEntity> & { entityType: EntityType; displayName: string }) => Entity;
  getEntity: (id: string) => Entity | undefined;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;

  // Relationships
  createRelationship: (sourceId: string, targetId: string, type: RelationshipType, weight?: Relationship["weight"]) => Relationship;
  getRelationships: (entityId: string) => Relationship[];
  deleteRelationship: (id: string) => void;

  // Queries
  getEntitiesByType: (type: EntityType) => Entity[];
  getEntitiesByTag: (tag: string) => Entity[];
  searchEntities: (query: string) => Entity[];

  // Tags
  addTag: (entityId: string, tag: string) => void;
  removeTag: (entityId: string, tag: string) => void;

  // Custom fields
  setCustomField: (entityId: string, key: string, value: string | number | boolean | null) => void;
}

const EntityCtx = createContext<EntityState | null>(null);

let idCounter = 0;
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${++idCounter}`;

export function EntityProvider({ children }: { children: ReactNode }) {
  const [entities, setEntities] = useState<Map<string, Entity>>(new Map());
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;

  const logEvent = useCallback((event: Omit<TimelineEvent, "id" | "timestamp" | "actorId">) => {
    const evt: TimelineEvent = {
      ...event,
      id: generateId("evt"),
      timestamp: new Date().toISOString(),
      actorId: "system",
    };
    setTimeline((prev) => [evt, ...prev].slice(0, 1000));
  }, []);

  const createEntity = useCallback((data: Partial<BaseEntity> & { entityType: EntityType; displayName: string }): Entity => {
    const now = new Date().toISOString();
    const id = data.id || generateId(data.entityType.substring(0, 3));
    const entity: BaseEntity = {
      id,
      entityType: data.entityType,
      displayName: data.displayName,
      description: data.description,
      status: data.status || "active",
      visibility: data.visibility || "internal",
      ownerId: data.ownerId,
      tags: data.tags || [],
      metadata: data.metadata || {},
      customFields: data.customFields || {},
      createdAt: now,
      updatedAt: now,
      coordinates: data.coordinates,
    };

    setEntities((prev) => {
      const next = new Map(prev);
      next.set(id, entity as Entity);
      return next;
    });
    logEvent({ eventType: "entity_created", entityType: data.entityType, entityId: id, description: `Created ${data.displayName}` });
    return entity as Entity;
  }, [logEvent]);

  const getEntity = useCallback((id: string) => entitiesRef.current.get(id), []);

  const updateEntity = useCallback((id: string, updates: Partial<Entity>) => {
    setEntities((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing) {
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        next.set(id, updated as Entity);
        logEvent({ eventType: "entity_updated", entityType: existing.entityType, entityId: id, description: `Updated ${existing.displayName}` });
      }
      return next;
    });
  }, [logEvent]);

  const deleteEntity = useCallback((id: string) => {
    const existing = entitiesRef.current.get(id);
    setEntities((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setRelationships((prev) => prev.filter((r) => r.sourceId !== id && r.targetId !== id));
    if (existing) logEvent({ eventType: "entity_deleted", entityType: existing.entityType, entityId: id, description: `Deleted ${existing.displayName}` });
  }, [logEvent]);

  const createRelationship = useCallback((sourceId: string, targetId: string, type: RelationshipType, weight: Relationship["weight"] = "medium"): Relationship => {
    const now = new Date().toISOString();
    const rel: Relationship = {
      id: generateId("rel"),
      sourceId, targetId, type, direction: "two-way", weight,
      status: "active", confidence: 75, startDate: now,
      visibility: "internal", metadata: {}, createdAt: now, updatedAt: now,
    };
    setRelationships((prev) => [...prev, rel]);
    logEvent({ eventType: "relationship_added", relationshipId: rel.id, description: `Connected ${sourceId} → ${targetId}` });
    return rel;
  }, [logEvent]);

  const getRelationships = useCallback((entityId: string) =>
    relationships.filter((r) => r.sourceId === entityId || r.targetId === entityId),
  [relationships]);

  const deleteRelationship = useCallback((id: string) => {
    setRelationships((prev) => prev.filter((r) => r.id !== id));
    logEvent({ eventType: "relationship_removed", relationshipId: id, description: "Relationship removed" });
  }, [logEvent]);

  const getEntitiesByType = useCallback((type: EntityType) =>
    Array.from(entitiesRef.current.values()).filter((e) => e.entityType === type),
  []);

  const getEntitiesByTag = useCallback((tag: string) =>
    Array.from(entitiesRef.current.values()).filter((e) => e.tags.includes(tag)),
  []);

  const searchEntities = useCallback((query: string) => {
    const q = query.toLowerCase();
    return Array.from(entitiesRef.current.values()).filter((e) =>
      e.displayName.toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, []);

  const addTag = useCallback((entityId: string, tag: string) => {
    updateEntity(entityId, {});
    setEntities((prev) => {
      const next = new Map(prev);
      const e = next.get(entityId);
      if (e && !e.tags.includes(tag)) {
        e.tags = [...e.tags, tag];
        next.set(entityId, { ...e });
      }
      return next;
    });
  }, [updateEntity]);

  const removeTag = useCallback((entityId: string, tag: string) => {
    setEntities((prev) => {
      const next = new Map(prev);
      const e = next.get(entityId);
      if (e) { e.tags = e.tags.filter((t) => t !== tag); next.set(entityId, { ...e }); }
      return next;
    });
  }, []);

  const setCustomField = useCallback((entityId: string, key: string, value: string | number | boolean | null) => {
    setEntities((prev) => {
      const next = new Map(prev);
      const e = next.get(entityId);
      if (e) { e.customFields = { ...e.customFields, [key]: value }; next.set(entityId, { ...e }); }
      return next;
    });
  }, []);

  return (
    <EntityCtx.Provider value={{
      entities, relationships, timeline,
      createEntity, getEntity, updateEntity, deleteEntity,
      createRelationship, getRelationships, deleteRelationship,
      getEntitiesByType, getEntitiesByTag, searchEntities,
      addTag, removeTag, setCustomField,
    }}>
      {children}
    </EntityCtx.Provider>
  );
}

export function useEntity(): EntityState {
  const ctx = useContext(EntityCtx);
  if (!ctx) throw new Error("useEntity must be used within EntityProvider");
  return ctx;
}
