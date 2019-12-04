// No need to import anything you're not going to use
import { TSXAir } from '@wixc3/tsx-air-framework';

// Components are TSX functions wrapped by TSXAir
export const ChildComp = TSXAir((props: { name: string }) => <div className="child">Child: {props.name}</div>);
export const ParentComp = TSXAir((props: { name: string }) => (
    <div className="parent">
        Parent: {props.name}
        <ChildComp name={props.name} />
    </div>
));
