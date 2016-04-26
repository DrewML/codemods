class Foo extends Component {
    constructor() {
        this.abc = this.abc.bind(this);
        this.bindThings();
    }

    bindThings() {
        this.abc = this.abc.bind(this);
    }

    abc() {}
}
