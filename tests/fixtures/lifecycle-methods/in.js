class Foo extends Component {
    shouldComponentUpdate() {
        this.something = this.something.bind(this);
    }

    render() {
        return;
    }
}
