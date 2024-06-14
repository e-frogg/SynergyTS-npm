import TreeItem from "./TreeItem";

export default class TreeFlattener {
    private categories: TreeItem[] = [];

    constructor(categories: TreeItem[]) {
        this.unpack(categories)
    }

    private unpack(categories: TreeItem[]) {
        this.categories = [...this.categories, ...categories];
        categories.forEach((category) => {
            if (category.children.length > 0) {
                this.unpack(category.children)
            }
        })
    }

    public getCategories():TreeItem[] {
        return this.categories;
    }
}
