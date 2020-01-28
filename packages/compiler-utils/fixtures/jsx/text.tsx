import {TSXAir} from '@tsx-air/framework';
export const MyComp = TSXAir((props:{text:string})=><div>
    this is a text: {props.text} !!!
    <div>
        this is some other text {props.text}
    </div>
    this is a static text
</div>);