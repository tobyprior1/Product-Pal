import type { OSTNode, Tree, Project, Interview, TreeSnapshot } from "../pm-types";

/** Row <-> domain mapping for everything the data store persists. */

export function dbNodeToOSTNode(dbNode: any): OSTNode {
  return {
    id: dbNode.id,
    parentId: dbNode.parent_id,
    type: dbNode.type,
    title: dbNode.title,
    notes: dbNode.notes,
    links: dbNode.links || [],
    createdAt: dbNode.created_at,
    updatedAt: dbNode.updated_at,
    createdBy: dbNode.created_by,
    updatedBy: dbNode.updated_by,
    ...dbNode.data,
  } as OSTNode;
}

export function ostNodeToDbNode(node: OSTNode, treeId: string) {
  const {
    id,
    parentId,
    type,
    title,
    notes,
    links,
    createdAt,
    updatedAt,
    createdBy,
    updatedBy,
    ...data
  } = node;

  return {
    id,
    tree_id: treeId,
    parent_id: parentId,
    type,
    title,
    notes,
    links,
    data,
    created_at: createdAt,
    updated_at: updatedAt,
    created_by: createdBy,
    updated_by: updatedBy,
  };
}

export function dbTreeToTree(row: any): Tree {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    projectId: row.project_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerId: row.user_id,
  };
}

export function dbProjectToProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerId: row.user_id,
  };
}

export function dbInterviewToInterview(row: any): Interview {
  return {
    id: row.id,
    treeId: row.tree_id,
    transcript: row.transcript,
    participantName: row.participant_name,
    conductedAt: row.conducted_at,
    videoUrl: row.video_url,
    uploadedAt: row.uploaded_at,
    status: row.status,
    createdBy: row.created_by,
  };
}

export function dbSnapshotToSnapshot(row: any): TreeSnapshot {
  return {
    id: row.id,
    label: row.label,
    timestamp: new Date(row.created_at).getTime(),
    nodes: row.nodes_data as OSTNode[],
  };
}
