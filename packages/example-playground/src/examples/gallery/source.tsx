// import { TSXAir, createElement } from '../../framework/runtime';
// import { useState, useEffect } from 'react';

// type GalleryType = 'infinite' | 'paged';
// type Images = string[];
// interface ImagesStore {
//     images: Images;
//     baseUrl: string;
//     loadMore: () => Promise<Images>;
//     setApiBaseUrl: (url: string) => Promise<Images>;
// }

// export interface GalleryProps {
//     type: GalleryType;
//     store: ImagesStore;
// }

// export interface GalleryDisplay {
//     images: Images;
//     loadMore: () => Promise<Images>;
//     onImageClicked: (image: string) => void;
// }

// const Infinite = TSXAir((props: GalleryDisplay) => {
//     useEffect(() => {
//         const onWindowScroll = (_: Event) => {
//             const { scrollHeight } = document.body;
//             const rect = document.body.getClientRects()[0] as DOMRect;
//             if (scrollHeight + rect.y - rect.height < 20) {
//                 props.loadMore();
//             }
//         };
//         window.addEventListener('scroll', onWindowScroll);

//         return () => window.removeEventListener('scroll', onWindowScroll);
//     });

//     return <div className="infinite-gallery">
//         {props.images.map((url, index) => <img src={url} key={`${url} [${index}]`} />)}
//     </div>;
// });

// <<<<<<< Updated upstream
// // changed to pass CI
// const Page = TSXAir((props: { children: TsxAirChild | TsxAirChild[] }) => {
//     return <div>
// =======
// // TODO: discuss children type and quantity, consider slot approach
// const Page = TSXAir((props: {children:Thumb[]}) => {
//     return <div className="page">
// >>>>>>> Stashed changes
//         {props.children}
//     </div>;
// });

// const Thumb = TSXAir((props: { url: string }) => <div className="thumb"><img src={props.url} /></div>);
// <<<<<<< Updated upstream

// =======
    
// >>>>>>> Stashed changes
// const Paged = TSXAir((props: GalleryDisplay) => {
//     const [page, setPage] = useState(0);
//     const next = () => {
//         if (((page + 1) * imagesPerPage >= images.length)) {
//             props.loadMore();
//         }
//         setPage(page + 1);
//     };
//     const prev = () => setPage(page - 1);
//     const imagesPerPage = 6;
//     const images = props.images.slice(page * imagesPerPage, (page + 1 * imagesPerPage));
//     return <div className="paged-gallery">
//         <button className={`prev ${page === 0 ? 'hidden' : ''}`} onClick={prev} />
//         <button className={`next ${(page + 1) * imagesPerPage >= images.length ? 'hidden' : ''}`} onClick={next} />
//         <Page>
//             {props.images.map((url, index) => <Thumb url={url} key={`${url} [${index}]`} />)}
//         </Page>
//         )} />
//     </div>;
// });

// export const Gellery = TSXAir<GalleryProps, { zoomed: string }>(
//     (props: GalleryProps) => {
//         const [zoomed, setZoomed] = useState<string | null>(null);
//         const loadMore = () => props.store.loadMore();
//         const exitZoomed = () => setZoomed(null);
//         return <div>
//             {
//                 zoomed === null
//                     ? null
//                     : <div className="modal" onClick={exitZoomed} >
// <<<<<<< Updated upstream
//                         {/* <Zoom url={zoomed} /> */}
// =======
//                         <Zoom url={zoomed} />
// >>>>>>> Stashed changes
//                     </div>
//             }
//             {
//                 props.type === 'infinite'
//                     ? <Infinite images={props.store.images}
//                         onImageClicked={setZoomed}
//                         loadMore={loadMore} />
//                     : <Paged images={props.store.images}
//                         onImageClicked={setZoomed}
//                         loadMore={loadMore} />
//             }
//         </div >;
//     }
// );

// <<<<<<< Updated upstream
// export const runExample = (_element: HTMLElement) => {
//     //
// }; 
// =======
// export const runExample = (element:HTMLElement) => {
    
// } 
// >>>>>>> Stashed changes
