import { TSXAir } from '@tsx-air/framework';

const Menu = TSXAir((p: { title: string, children: any }) =>
    <div>
        <span>{p.title}</span>
        {p.children}
        <Comp />
        <hr />
    </div>
);

const App = TSXAir((p: { a: number, b:any }) =>
    <div>
    <Menu title={p.b} >
        <div>{p.a}</div>
        <div>{p.a + 1}</div>
        {p.a ? <div /> : null}
    </Menu>
    {p.a ? <div /> : null}
    </div>
);
/* 
App.context ={
    root: 'instance of Menu', // return statement of preRender (as instance of frag or component)    
}

App => preRender -> VElm{menu, props:{
    title: p.b,
    children:[VElm(Frag1, App.props, key1 ), VElm(Frag2, App.props, key2 ), VElm(Frag3, App.props, key3 )]
}, key:'root'} => return to framework => framework creates menu instanceof
=> App.context.root = result

FragMenu1


Menu.context = {
    root: FragMenu1 instance
}
new Menu
Menu => preRender => VElm(FragMenu1, {title, children, key:'root'})
=> creare new FragMenu1 => Menu.context.root = result

FragMenu1.context = {
    root: div
    exp1: {
        location: ref
        value: 'title'
    }
    exp2: {
        location: ref
        value: [ Frag1 instance, Frag2 instance, Frag3 instance]               
    } 
}

new FragMenu1
FragMenu1 => framework checks that FragMenu1.ctx.root is a div =>
adds to stage
 */