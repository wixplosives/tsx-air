import { Component, VirtualElement, CompFactory, Fragment, Factory } from '@tsx-air/framework';
import { TSXAir, store } from '@tsx-air/framework';
const Gallery = /** @class */ (() => {
    class Gallery extends Component {
        constructor() {
            super(...arguments);
            this.lambda0 = (...args) => this._lambda0(...args);
            this.lambda1 = (...args) => this._lambda1(...args);
        }
        preRender() {
            const { state } = this.state;
            const deleteButton = (imgName => {
                const t = imgName;
                return <button onClick={() => state.images = state.images.filter(i => i.src !== t)} disabled={state.images.find(i => i.src === imgName)}/>;
            });
            this.volatile = { deleteButton }
            return VirtualElement.fragment("2", Gallery.div2, this);
        }
        _lambda0(imgName) {
            const t = imgName;
            return VirtualElement.fragment("0", Gallery.button0, this);
        }
        _lambda1(img, i) {
            return VirtualElement.fragment("1", Gallery.div1, this);
        }
    }
    Gallery.factory = new CompFactory(Gallery, { "props.baseUrl": 1 << 0, "state.images": 1 << 1 }, props => ({
        "state": {
            images: [
                { dataId: 0, src: "bunny.jpg" },
                { dataId: 1, src: "gradient.jpg" },
                { dataId: 2, src: "pretty-boy.jpg" },
                { dataId: 3, src: "weird.jpg" }
            ]
        }
    }));
    return Gallery;
})();
export { Gallery };
{
    let button0 = /** @class */ (() => {
        class button0 extends Fragment {
            updateView($ch) {
                const { state } = this.state;
                const $b = this.changesBitMap
                if ($ch & ($b["state.images"]))
                    this.ctx.elements[0].setAttribute("disabled", state.images.find(i => i.src === imgName))
            }
            toString() {
                const { state } = this.state;
                return this.unique(`<button disabled="${state.images.find(i => i.src === imgName)}" x-da="!"></button>`);
            }
            hydrate(_, t) {
                this.hydrateElements(t)
                this.ctx.root = t
            }
        }
        button0.factory = new Factory(button0, Gallery.changesBitMap);
        return button0;
    })();
    Gallery.button0 = button0
}
{
    let div1 = /** @class */ (() => {
        class div1 extends Fragment {
            updateView($ch) {
                const { props } = this;
                const { state } = this.state;
                let { deleteButton } = this.volatile;
                const $b = this.changesBitMap
                if ($ch & ($b["state.images"]))
                    $rt().updateExpression(this.ctx.expressions[0], deleteButton(img.src))
                if ($ch & ($b["props.baseUrl"]))
                    this.ctx.elements[1].setAttribute("src", `/${props.baseUrl}/${img}`)
                if ($ch & ($b["state.images"]))
                    this.ctx.elements[1].setAttribute("alt", `image ${i + 1}/${state.images.length}`)
            }
            toString() {
                const { props } = this;
                const { state } = this.state;
                let { deleteButton } = this.volatile;
                return this.unique(`<div key="${img.dataId + ""}" x-da="!">
            <img src="${`/${props.baseUrl}/${img}`}" alt="${`image ${i + 1}/${state.images.length}`}" x-da="!"></img>
            <!--X-->${$rt().toString(deleteButton(img.src))}<!--X-->
        </div>`);
            }
            hydrate(_, t) {
                let { deleteButton } = this.volatile;
                this.hydrateExpressions([deleteButton(img.src)], t)
                this.hydrateElements(t)
                this.ctx.root = t
            }
        }
        div1.factory = new Factory(div1, Gallery.changesBitMap);
        return div1;
    })();
    Gallery.div1 = div1
}
{
    let div2 = /** @class */ (() => {
        class div2 extends Fragment {
            updateView($ch) {
                const { props } = this;
                const { state } = this.state;
                let { deleteButton } = this.volatile;
                const $b = this.changesBitMap
                if ($ch & ($b["props.baseUrl"] | $b["state.images"]))
                    $rt().updateExpression(this.ctx.expressions[0], state.images.map((img, i) => VirtualElement.fragment("1", Gallery.div1, this)))
                if ($ch & ($b["state.images"]))
                    $rt().updateExpression(this.ctx.expressions[1], deleteButton(img.src))
                if ($ch & ($b["props.baseUrl"]))
                    this.ctx.elements[1].setAttribute("src", `/${props.baseUrl}/${img}`)
                if ($ch & ($b["state.images"]))
                    this.ctx.elements[1].setAttribute("alt", `image ${i + 1}/${state.images.length}`)
            }
            toString() {
                const { props } = this;
                const { state } = this.state;
                let { deleteButton } = this.volatile;
                return this.unique(`<div class="gallery">
        <!--X-->${$rt().toString(state.images.map((img, i) => VirtualElement.fragment("1", Gallery.div1, this)))}<!--X-->
    </div>`);
            }
            hydrate(_, t) {
                const { state } = this.state;
                let { deleteButton } = this.volatile;
                this.hydrateExpressions([state.images.map((img, i) => VirtualElement.fragment("1", Gallery.div1, this)), deleteButton(img.src)], t)
                this.hydrateElements(t)
                this.ctx.root = t
            }
        }
        div2.factory = new Factory(div2, Gallery.changesBitMap);
        return div2;
    })();
    Gallery.div2 = div2
}