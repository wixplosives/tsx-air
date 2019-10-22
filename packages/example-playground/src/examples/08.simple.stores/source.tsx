import { TSXAir } from '../../framework';
import { Store, store } from '../../framework/api/store';


export interface ShopItem {
    label: string;
    img: string;
    code: string;
    price: number;
}

export interface CartData {
    [code: string]: number;
}

const Item = TSXAir((props: { item: ShopItem, cart: Store<CartData> }) => {
    const { cart, item: { code } } = props;
    cart[code] = cart[code] || 0;
    return <div>
        <div>{props.item.label}</div>
        <div>{props.item.price}</div>
        <img src={props.item.img} alt={props.item.label} />
        <div><input type="number" step={1} min={0} value={cart[code]}/></div>
    </div>;
});

const Cart = TSXAir((props: { cart: Store<CartData>, items: Store<ShopItem[]> }) => {
    const purchased = [];
    for (const [code, amount] of Object.entries(props.cart)) {
        if (amount > 0) {
            purchased.push({ item: props.items.find(i => i.code === code)!, amount });
        }
    }
    return <div>
        <ul>
            {purchased.map(({ item, amount }) => <li key={item.code}>{item.label} [{amount}]
            <button onClick={() => props.cart[item.code] = 0}>❌</button>
            </li>)}
        </ul>
        <div>Total: {purchased.reduce((acc, { item, amount }) => acc + item.price * amount, 0)}$</div>
    </div>;
});



const Catalog = TSXAir((props: { cart: Store<CartData>, items: Store<ShopItem[]> }) => {
    return <div>
        <ul>
            {props.items.map(item => <li key={item.code}>
                <Item item={item} cart={props.cart} />
            </li>)}
        </ul>
    </div>;
});

export const Shop = TSXAir((props: { items: ShopItem[] }) => {
    const cart = store({} as CartData);
    const items = store(props.items);
    

    return <div>
        <Catalog {...{items, cart}} />
        <Cart {...{ items, cart }}/>
    </div>;
    
});