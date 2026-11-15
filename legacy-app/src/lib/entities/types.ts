/**
 * Universal Entity Architecture
 * Master Specification: People System, Relationship Engine & Intelligence Graph
 *
 * Every object in the system is represented as an Entity.
 * Relationships are first-class objects with their own metadata.
 * The architecture is a graph: Entities become nodes, Relationships become edges.
 */

// ===== Core Entity Types =====
export type EntityType =
  | "person"
  | "organization"
  | "company"
  | "government"
  | "location"
  | "project"
  | "asset"
  | "event"
  | "investment"
  | "custom";

export type EntityStatus =
  | "active"
  | "hidden"
  | "archived"
  | "deleted"
  | "pending"
  | "locked"
  | "verified";

export type Visibility = "public" | "internal" | "restricted" | "classified";

// ===== Base Entity Interface =====
export interface BaseEntity {
  id: string;                    // Globally unique, immutable
  entityType: EntityType;
  displayName: string;
  description?: string;
  status: EntityStatus;
  visibility: Visibility;
  ownerId?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  customFields: Record<string, string | number | boolean | null>;
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  // Geographic anchor (optional — not all entities have coordinates)
  coordinates?: {
    lat: number;
    lon: number;
    elevation?: number;
  };
}

// ===== Person Entity =====
export interface PersonEntity extends BaseEntity {
  entityType: "person";
  fullName: string;
  alias?: string;
  profileImage?: string;
  dateOfBirth?: string;
  nationality?: string;
  occupation?: string;
  languages?: string[];
  contact?: {
    phone?: string;
    email?: string;
    preferredCommunication?: string;
    addresses?: string[];
  };
  organizationIds?: string[];
  clearanceLevel?: string;
  trustScore?: number;
}

// ===== Organization Entity =====
export interface OrganizationEntity extends BaseEntity {
  entityType: "organization" | "company" | "government";
  officialName: string;
  industry?: string;
  country?: string;
  headquarters?: string;
  parentOrgId?: string;
  subsidiaryIds?: string[];
  employeeCount?: number;
  foundedYear?: number;
  logo?: string;
}

// ===== Location Entity =====
export interface LocationEntity extends BaseEntity {
  entityType: "location";
  country: string;
  administrativeRegion?: string;
  city: string;
  address?: string;
  timezone?: string;
  population?: number;
  area?: number;
  isoCodes?: { alpha2?: string; alpha3?: string };
  nearbyEntityIds?: string[];
}

// ===== Project Entity =====
export interface ProjectEntity extends BaseEntity {
  entityType: "project";
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedReturn?: string;
  riskLevel?: "low" | "moderate" | "elevated" | "high";
  requiredMembers?: number;
  investmentWindow?: string;
  partnershipPercent?: number;
  valueChf?: number;
  status: EntityStatus;
}

// ===== Asset Entity =====
export interface AssetEntity extends BaseEntity {
  entityType: "asset";
  assetType: "financial" | "physical" | "digital" | "strategic" | "classified";
  valueChf?: number;
  custodian?: string;
  classificationLevel?: "internal" | "restricted" | "confidential" | "classified";
}

// ===== Union of all entity types =====
export type Entity = PersonEntity | OrganizationEntity | LocationEntity | ProjectEntity | AssetEntity | BaseEntity;

// ===== Relationship Engine =====
export type RelationshipType =
  | "friend" | "family" | "colleague" | "employee" | "manager"
  | "partner" | "customer" | "supplier" | "owner" | "investor"
  | "member" | "student" | "teacher" | "supervisor" | "client"
  | "competitor" | "neighbor" | "ally" | "subsidiary" | "custom";

export type RelationshipDirection = "one-way" | "two-way" | "hierarchical";

export type RelationshipWeight = "weak" | "medium" | "strong" | "critical";

export type RelationshipStatus = "active" | "inactive" | "historical" | "scheduled";

export interface Relationship {
  id: string;                     // Globally unique
  sourceId: string;               // Source entity ID
  targetId: string;               // Target entity ID
  type: RelationshipType;
  customType?: string;            // For custom relationship types
  direction: RelationshipDirection;
  weight: RelationshipWeight;
  status: RelationshipStatus;
  confidence: number;             // 0-100
  startDate?: string;
  endDate?: string;
  description?: string;
  notes?: string;
  evidence?: string[];
  visibility: Visibility;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ===== Timeline & Events =====
export type EventType =
  | "entity_created" | "entity_updated" | "entity_deleted"
  | "relationship_added" | "relationship_removed"
  | "status_changed" | "metadata_updated"
  | "user_login" | "user_logout" | "permission_changed"
  | "import_completed" | "export_generated"
  | "search_performed" | "navigation"
  | "custom";

export interface TimelineEvent {
  id: string;
  eventType: EventType;
  entityType?: EntityType;
  entityId?: string;
  relationshipId?: string;
  actorId: string;                // User or system actor
  timestamp: string;              // ISO timestamp
  description: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  deviceInfo?: string;
}

// ===== Camera State (for future Phase 2) =====
export interface CameraState {
  lat: number;
  lon: number;
  altitude: number;              // Meters above surface
  zoom: number;                  // Derived from altitude
  heading: number;               // Degrees
  pitch: number;                 // Degrees
  roll: number;                  // Degrees (usually 0)
  fov: number;                   // Field of view in degrees (35-55)
}

export interface CameraBookmark {
  id: string;
  name: string;
  camera: CameraState;
  timestamp: string;
  notes?: string;
  category?: string;
}

// ===== Search =====
export interface SearchResult {
  id: string;
  name: string;
  type: EntityType | "country" | "city" | "region" | "landmark" | "airport" | "port";
  country?: string;
  region?: string;
  lat: number;
  lon: number;
  population?: number;
  importance?: number;
  metadata?: Record<string, unknown>;
}

// ===== Permissions =====
export type Role = "administrator" | "manager" | "analyst" | "researcher" | "viewer" | "guest";

export interface Permission {
  role: Role;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  entityTypes: EntityType[];
  objectIds?: string[];          // Object-level permissions
}

// ===== Analytics =====
export interface GraphMetrics {
  totalEntities: number;
  totalRelationships: number;
  entitiesByType: Record<EntityType, number>;
  relationshipsByType: Record<RelationshipType, number>;
  averageConnections: number;
  mostConnected: { entityId: string; name: string; connectionCount: number }[];
  clusters: { id: string; entityIds: string[]; label: string }[];
  growthRate: number;            // Percentage over time window
}
