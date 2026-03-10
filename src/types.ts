export interface VideoNode {
  id: string;
  title: string;
  parentId: string | null;
  videoUrl: string;
  description?: string;
  citations?: string;
}

export interface HierarchyNode extends VideoNode {
  children?: HierarchyNode[];
}
