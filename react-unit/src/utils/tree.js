class File {
    constructor(n, d) {
        this.name = n;
        this.desc = d;
    }
}

class Folder {
    constructor(n, d) {
        super(n, d)
        this.cotent = new Map
        this.desc = d
    }

    add(d) {
        this.content.set(d.name, d)
    }

    del(n) {
        this.content.delete(n)
    }

    clear() {
        this.content.clear()
    }

    get(n) {
        return this.content.get(n)
    }

    [Symbol.iterator]() {
		return this.content.values()
    }
    

}