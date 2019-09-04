// tslint:disable: jsx-no-lambda
// tslint:disable: label-position
import { TSXAir, render, getState, TsxAirChild } from '../../framework/runtime/runtime2';
import { TsxAirNode } from '../../framework/api/types';



export const SlideShow = TSXAir((props: { children: TsxAirChild[], currentSlide: number, style?: any }) => {

    return <div style={props.style}>
        {props.children[props.currentSlide]}
    </div> as any;

});



export const Gallery = TSXAir((props: { urls: string[] }) => {
    const state = getState({
        currentSlide: 0
    });

    const next = () => { state.currentSlide++; };
    return <div>
        <SlideShow currentSlide={state.currentSlide} style={{ width: '500px', height: '500px', padding: '10px', background: 'gray' }}>
            {/* {
                props.urls.map(url => <img src={url} key={url} style={{width: '100%', height: '100%'}}/>)
            }
            <div>Thanks for viewing</div>  
            
            
            */}
        </SlideShow>
        <button onClick={() => { state.currentSlide--; }} disabled={state.currentSlide === 0}>Prev !</button>
        <button onClick={() => { state.currentSlide++; }} disabled={state.currentSlide >= props.urls.length - 1}>Next !</button>
    </div> as any;

});

export const runExample = (element: HTMLElement) => {
    render(element, Gallery, {
        urls: ['https://cdn2.thecatapi.com/images/qqyh5pKKs.jpg', 'https://cdn2.thecatapi.com/images/bkmLO58jE.jpg',
            'https://cdn2.thecatapi.com/images/KUEJ039io.jpg', 'https://cdn2.thecatapi.com/images/OS1VioBop.jpg',
            'https://cdn2.thecatapi.com/images/vxK9Ac6QU.jpg', 'https://cdn2.thecatapi.com/images/c1vgfDv0b.jpg',
            'https://cdn2.thecatapi.com/images/5A6g4xtZo.jpg', 'https://cdn2.thecatapi.com/images/mt0WK1Pm_.jpg']
    });

};