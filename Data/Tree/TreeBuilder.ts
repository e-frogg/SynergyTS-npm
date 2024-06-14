import TreeItem from "./TreeItem";
import Repository from "../Repository";

export default class TreeBuilder {
    constructor(
        private categoryRepository: Repository<TreeItem>,
    ) {
    }

    public buildTree(categories: TreeItem[], level: number=0) {
        categories.forEach((category) => {
            category.children = this.categoryRepository.findItemsBy({parentId: category.id}).getItems();
            category.level = level;
            this.buildTree(category.children,level+1);
        })
    }
}
