import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: string | null;
}

export interface PublicCategory extends CategoryRow {
  children: PublicCategory[];
}

const buildCategoryTree = (categories: CategoryRow[]): PublicCategory[] => {
  const nodes = new Map(categories.map((category) => [category.id, { ...category, children: [] as PublicCategory[] }]));
  const roots: PublicCategory[] = [];

  for (const category of nodes.values()) {
    const parent = category.parentId ? nodes.get(category.parentId) : undefined;
    if (parent) parent.children.push(category);
    else roots.push(category);
  }

  const sortTree = (nodesToSort: PublicCategory[]) => {
    nodesToSort.sort((a, b) => a.name.localeCompare(b.name));
    nodesToSort.forEach((node) => sortTree(node.children));
  };
  sortTree(roots);
  return roots;
};

const getAllCategoryRows = () => prisma.category.findMany({
  select: { id: true, name: true, slug: true, imageUrl: true, parentId: true },
});

export const listCategories = async (): Promise<PublicCategory[]> => buildCategoryTree(await getAllCategoryRows());

export const getCategoryBySlug = async (slug: string): Promise<PublicCategory> => {
  const category = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (!category) throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");

  const findInTree = (nodes: PublicCategory[]): PublicCategory | undefined => {
    for (const node of nodes) {
      if (node.id === category.id) return node;
      const child = findInTree(node.children);
      if (child) return child;
    }
  };

  const result = findInTree(await listCategories());
  if (!result) throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");
  return result;
};

export const getCategoryAndDescendantIds = async (categoryId: string): Promise<string[]> => {
  const categories = await getAllCategoryRows();
  const ids = new Set<string>([categoryId]);
  let added = true;

  while (added) {
    added = false;
    for (const category of categories) {
      if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
        ids.add(category.id);
        added = true;
      }
    }
  }

  return [...ids];
};
