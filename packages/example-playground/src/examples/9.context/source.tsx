import { TSXAir } from '../../framework';
import { Store, store } from '../../framework/api/store';
import { ShopItem, CartData } from '../simple.stores/source';
import { getContext, setChildrenContext } from '../../framework/api/context';

interface ShopContext {
    cart: Store<CartData>;
    items: Store<ShopItem[]>;
}

const Item = TSXAir((props: { itemIndex: number }) => {
    const { cart, items } = getContext<ShopContext>();
    const item = items[props.itemIndex];
    cart[item.code] = cart[item.code] || 0;
    return <div>
        <div>{item.label}</div>
        <div>{item.price}</div>
        <img src={item.img} alt={item.label} />
        <div><input type="number" step={1} min={0} value={cart[item.code]} /></div>
    </div>;
});

const Cart = TSXAir(() => {
    const { cart, items } = getContext<ShopContext>();
    const purchased = [];
    for (const [code, amount] of Object.entries(cart)) {
        if (amount > 0) {
            purchased.push({ item: items.find(i => i.code === code)!, amount });
        }
    }
    return <div>
        <ul>
            {purchased.map(({ item, amount }) => <li key={item.code}>{item.label} [{amount}]
            <button onClick={() => cart[item.code] = 0}>❌</button>
            </li>)}
        </ul>
        <div>Total: {purchased.reduce((acc, { item, amount }) => acc + item.price * amount, 0)}$</div>
    </div>;
});



const Catalog = TSXAir(() => {
    const { items } = getContext<ShopContext>();

    return <div>
        <ul>
            {items.map(({ code }, index) => <li key={code}>
                <Item itemIndex={index} />
            </li>)}
        </ul>
    </div>;
});

export const Shop = TSXAir((props: { items: ShopItem[] }) => {
    const cart = store({} as CartData);
    const items = store(props.items);
    setChildrenContext(store({ cart, items }));

    return <div>
        <Catalog />
        <Cart />
    </div>;
});