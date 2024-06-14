import Entity from "../Entity";
import Repository from "../Repository";

export default class TreeItem extends Entity {
    // public repository: Repository<TreeItem>;

    public rootId: string = '';
    public parentId: string = '';

    public level: number = 0;
    public children: TreeItem[] = []

    // public get root(): TreeItem | null {
    //     return this.repository.get(this.rootId);
    // }
    //
    // public get parent(): TreeItem | null {
    //     return this.repository.get(this.parentId);
    // }
}
