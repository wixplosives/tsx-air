import { Properties } from 'csstype';
import { ChangeEvent } from 'react';
import { TsxAirChild } from './framework-types';


export type CSSProperties = Properties<string | number>;



export interface AriaAttributes {
    /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
    'aria-activedescendant'?: string;
    /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
    'aria-atomic'?: boolean | 'false' | 'true';
    /**
     * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
     * presented if they are made.
     */
    'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
    /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
    'aria-busy'?: boolean | 'false' | 'true';
    /**
     * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
     * @see aria-pressed @see aria-selected.
     */
    'aria-checked'?: boolean | 'false' | 'mixed' | 'true';
    /**
     * Defines the total number of columns in a table, grid, or treegrid.
     * @see aria-colindex.
     */
    'aria-colcount'?: number;
    /**
     * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
     * @see aria-colcount @see aria-colspan.
     */
    'aria-colindex'?: number;
    /**
     * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
     * @see aria-colindex @see aria-rowspan.
     */
    'aria-colspan'?: number;
    /**
     * Identifies the element (or elements) whose contents or presence are controlled by the current element.
     * @see aria-owns.
     */
    'aria-controls'?: string;
    /** Indicates the element that represents the current item within a container or set of related elements. */
    'aria-current'?: boolean | 'false' | 'true' | 'page' | 'step' | 'location' | 'date' | 'time';
    /**
     * Identifies the element (or elements) that describes the object.
     * @see aria-labelledby
     */
    'aria-describedby'?: string;
    /**
     * Identifies the element that provides a detailed, extended description for the object.
     * @see aria-describedby.
     */
    'aria-details'?: string;
    /**
     * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
     * @see aria-hidden @see aria-readonly.
     */
    'aria-disabled'?: boolean | 'false' | 'true';
    /**
     * Indicates what functions can be performed when a dragged object is released on the drop target.
     * @deprecated in ARIA 1.1
     */
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
    /**
     * Identifies the element that provides an error message for the object.
     * @see aria-invalid @see aria-describedby.
     */
    'aria-errormessage'?: string;
    /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
    'aria-expanded'?: boolean | 'false' | 'true';
    /**
     * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
     * allows assistive technology to override the general default of reading in document source order.
     */
    'aria-flowto'?: string;
    /**
     * Indicates an element's "grabbed" state in a drag-and-drop operation.
     * @deprecated in ARIA 1.1
     */
    'aria-grabbed'?: boolean | 'false' | 'true';
    /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
    'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
    /**
     * Indicates whether the element is exposed to an accessibility API.
     * @see aria-disabled.
     */
    'aria-hidden'?: boolean | 'false' | 'true';
    /**
     * Indicates the entered value does not conform to the format expected by the application.
     * @see aria-errormessage.
     */
    'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
    /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
    'aria-keyshortcuts'?: string;
    /**
     * Defines a string value that labels the current element.
     * @see aria-labelledby.
     */
    'aria-label'?: string;
    /**
     * Identifies the element (or elements) that labels the current element.
     * @see aria-describedby.
     */
    'aria-labelledby'?: string;
    /** Defines the hierarchical level of an element within a structure. */
    'aria-level'?: number;
    /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
    'aria-live'?: 'off' | 'assertive' | 'polite';
    /** Indicates whether an element is modal when displayed. */
    'aria-modal'?: boolean | 'false' | 'true';
    /** Indicates whether a text box accepts multiple lines of input or only a single line. */
    'aria-multiline'?: boolean | 'false' | 'true';
    /** Indicates that the user may select more than one item from the current selectable descendants. */
    'aria-multiselectable'?: boolean | 'false' | 'true';
    /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
    'aria-orientation'?: 'horizontal' | 'vertical';
    /**
     * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
     * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
     * @see aria-controls.
     */
    'aria-owns'?: string;
    /**
     * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
     * A hint could be a sample value or a brief description of the expected format.
     */
    'aria-placeholder'?: string;
    /**
     * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
     * @see aria-setsize.
     */
    'aria-posinset'?: number;
    /**
     * Indicates the current "pressed" state of toggle buttons.
     * @see aria-checked @see aria-selected.
     */
    'aria-pressed'?: boolean | 'false' | 'mixed' | 'true';
    /**
     * Indicates that the element is not editable, but is otherwise operable.
     * @see aria-disabled.
     */
    'aria-readonly'?: boolean | 'false' | 'true';
    /**
     * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
     * @see aria-atomic.
     */
    'aria-relevant'?: 'additions' | 'additions text' | 'all' | 'removals' | 'text';
    /** Indicates that user input is required on the element before a form may be submitted. */
    'aria-required'?: boolean | 'false' | 'true';
    /** Defines a human-readable, author-localized description for the role of an element. */
    'aria-roledescription'?: string;
    /**
     * Defines the total number of rows in a table, grid, or treegrid.
     * @see aria-rowindex.
     */
    'aria-rowcount'?: number;
    /**
     * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
     * @see aria-rowcount @see aria-rowspan.
     */
    'aria-rowindex'?: number;
    /**
     * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
     * @see aria-rowindex @see aria-colspan.
     */
    'aria-rowspan'?: number;
    /**
     * Indicates the current "selected" state of various widgets.
     * @see aria-checked @see aria-pressed.
     */
    'aria-selected'?: boolean | 'false' | 'true';
    /**
     * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
     * @see aria-posinset.
     */
    'aria-setsize'?: number;
    /** Indicates if items in a table or grid are sorted in ascending or descending order. */
    'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
    /** Defines the maximum allowed value for a range widget. */
    'aria-valuemax'?: number;
    /** Defines the minimum allowed value for a range widget. */
    'aria-valuemin'?: number;
    /**
     * Defines the current value for a range widget.
     * @see aria-valuetext.
     */
    'aria-valuenow'?: number;
    /** Defines the human readable text alternative of aria-valuenow for a range widget. */
    'aria-valuetext'?: string;
}
export type NativeEventHandler<CURR_TARGET, EVENT> = (ev: EVENT & { currentTarget: CURR_TARGET }) => void;

interface DOMAttributes<T> {
    dangerouslySetInnerHTML?: {
        __html: string;
    };

    // Clipboard Events
    onCopy?: NativeEventHandler<T, ClipboardEvent>;
    onCopyCapture?: NativeEventHandler<T, ClipboardEvent>;
    onCut?: NativeEventHandler<T, ClipboardEvent>;
    onCutCapture?: NativeEventHandler<T, ClipboardEvent>;
    onPaste?: NativeEventHandler<T, ClipboardEvent>;
    onPasteCapture?: NativeEventHandler<T, ClipboardEvent>;

    // Composition Events
    onCompositionEnd?: NativeEventHandler<T, CompositionEvent>;
    onCompositionEndCapture?: NativeEventHandler<T, CompositionEvent>;
    onCompositionStart?: NativeEventHandler<T, CompositionEvent>;
    onCompositionStartCapture?: NativeEventHandler<T, CompositionEvent>;
    onCompositionUpdate?: NativeEventHandler<T, CompositionEvent>;
    onCompositionUpdateCapture?: NativeEventHandler<T, CompositionEvent>;

    // Focus Events
    onFocus?: NativeEventHandler<T, FocusEvent>;
    onFocusCapture?: NativeEventHandler<T, FocusEvent>;
    onBlur?: NativeEventHandler<T, FocusEvent>;
    onBlurCapture?: NativeEventHandler<T, FocusEvent>;

    // Form Events
    onChange?: NativeEventHandler<T, ChangeEvent>;
    onChangeCapture?: NativeEventHandler<T, ChangeEvent>;
    onBeforeInput?: NativeEventHandler<T, ChangeEvent>;
    onBeforeInputCapture?: NativeEventHandler<T, ChangeEvent>;
    onInput?: NativeEventHandler<T, ChangeEvent>;
    onInputCapture?: NativeEventHandler<T, ChangeEvent>;
    onReset?: NativeEventHandler<T, ChangeEvent>;
    onResetCapture?: NativeEventHandler<T, ChangeEvent>;
    onSubmit?: NativeEventHandler<T, ChangeEvent>;
    onSubmitCapture?: NativeEventHandler<T, ChangeEvent>;
    onInvalid?: NativeEventHandler<T, ChangeEvent>;
    onInvalidCapture?: NativeEventHandler<T, ChangeEvent>;

    // Image Events
    onLoad?: NativeEventHandler<T, Event>;
    onLoadCapture?: NativeEventHandler<T, Event>;
    onError?: NativeEventHandler<T, Event>; // also a Media Event
    onErrorCapture?: NativeEventHandler<T, Event>; // also a Media Event

    // Keyboard Events
    onKeyDown?: NativeEventHandler<T, KeyboardEvent>;
    onKeyDownCapture?: NativeEventHandler<T, KeyboardEvent>;
    onKeyPress?: NativeEventHandler<T, KeyboardEvent>;
    onKeyPressCapture?: NativeEventHandler<T, KeyboardEvent>;
    onKeyUp?: NativeEventHandler<T, KeyboardEvent>;
    onKeyUpCapture?: NativeEventHandler<T, KeyboardEvent>;

    // Media Events
    onAbort?: NativeEventHandler<T, Event>;
    onAbortCapture?: NativeEventHandler<T, Event>;
    onCanPlay?: NativeEventHandler<T, Event>;
    onCanPlayCapture?: NativeEventHandler<T, Event>;
    onCanPlayThrough?: NativeEventHandler<T, Event>;
    onCanPlayThroughCapture?: NativeEventHandler<T, Event>;
    onDurationChange?: NativeEventHandler<T, Event>;
    onDurationChangeCapture?: NativeEventHandler<T, Event>;
    onEmptied?: NativeEventHandler<T, Event>;
    onEmptiedCapture?: NativeEventHandler<T, Event>;
    onEncrypted?: NativeEventHandler<T, Event>;
    onEncryptedCapture?: NativeEventHandler<T, Event>;
    onEnded?: NativeEventHandler<T, Event>;
    onEndedCapture?: NativeEventHandler<T, Event>;
    onLoadedData?: NativeEventHandler<T, Event>;
    onLoadedDataCapture?: NativeEventHandler<T, Event>;
    onLoadedMetadata?: NativeEventHandler<T, Event>;
    onLoadedMetadataCapture?: NativeEventHandler<T, Event>;
    onLoadStart?: NativeEventHandler<T, Event>;
    onLoadStartCapture?: NativeEventHandler<T, Event>;
    onPause?: NativeEventHandler<T, Event>;
    onPauseCapture?: NativeEventHandler<T, Event>;
    onPlay?: NativeEventHandler<T, Event>;
    onPlayCapture?: NativeEventHandler<T, Event>;
    onPlaying?: NativeEventHandler<T, Event>;
    onPlayingCapture?: NativeEventHandler<T, Event>;
    onProgress?: NativeEventHandler<T, Event>;
    onProgressCapture?: NativeEventHandler<T, Event>;
    onRateChange?: NativeEventHandler<T, Event>;
    onRateChangeCapture?: NativeEventHandler<T, Event>;
    onSeeked?: NativeEventHandler<T, Event>;
    onSeekedCapture?: NativeEventHandler<T, Event>;
    onSeeking?: NativeEventHandler<T, Event>;
    onSeekingCapture?: NativeEventHandler<T, Event>;
    onStalled?: NativeEventHandler<T, Event>;
    onStalledCapture?: NativeEventHandler<T, Event>;
    onSuspend?: NativeEventHandler<T, Event>;
    onSuspendCapture?: NativeEventHandler<T, Event>;
    onTimeUpdate?: NativeEventHandler<T, Event>;
    onTimeUpdateCapture?: NativeEventHandler<T, Event>;
    onVolumeChange?: NativeEventHandler<T, Event>;
    onVolumeChangeCapture?: NativeEventHandler<T, Event>;
    onWaiting?: NativeEventHandler<T, Event>;
    onWaitingCapture?: NativeEventHandler<T, Event>;

    // MouseEvents
    onAuxClick?: NativeEventHandler<T, MouseEvent>;
    onAuxClickCapture?: NativeEventHandler<T, MouseEvent>;
    onClick?: NativeEventHandler<T, MouseEvent>;
    onClickCapture?: NativeEventHandler<T, MouseEvent>;
    onContextMenu?: NativeEventHandler<T, MouseEvent>;
    onContextMenuCapture?: NativeEventHandler<T, MouseEvent>;
    onDoubleClick?: NativeEventHandler<T, MouseEvent>;
    onDoubleClickCapture?: NativeEventHandler<T, MouseEvent>;
    onDrag?: NativeEventHandler<T, DragEvent>;
    onDragCapture?: NativeEventHandler<T, DragEvent>;
    onDragEnd?: NativeEventHandler<T, DragEvent>;
    onDragEndCapture?: NativeEventHandler<T, DragEvent>;
    onDragEnter?: NativeEventHandler<T, DragEvent>;
    onDragEnterCapture?: NativeEventHandler<T, DragEvent>;
    onDragExit?: NativeEventHandler<T, DragEvent>;
    onDragExitCapture?: NativeEventHandler<T, DragEvent>;
    onDragLeave?: NativeEventHandler<T, DragEvent>;
    onDragLeaveCapture?: NativeEventHandler<T, DragEvent>;
    onDragOver?: NativeEventHandler<T, DragEvent>;
    onDragOverCapture?: NativeEventHandler<T, DragEvent>;
    onDragStart?: NativeEventHandler<T, DragEvent>;
    onDragStartCapture?: NativeEventHandler<T, DragEvent>;
    onDrop?: NativeEventHandler<T, DragEvent>;
    onDropCapture?: NativeEventHandler<T, DragEvent>;
    onMouseDown?: NativeEventHandler<T, MouseEvent>;
    onMouseDownCapture?: NativeEventHandler<T, MouseEvent>;
    onMouseEnter?: NativeEventHandler<T, MouseEvent>;
    onMouseLeave?: NativeEventHandler<T, MouseEvent>;
    onMouseMove?: NativeEventHandler<T, MouseEvent>;
    onMouseMoveCapture?: NativeEventHandler<T, MouseEvent>;
    onMouseOut?: NativeEventHandler<T, MouseEvent>;
    onMouseOutCapture?: NativeEventHandler<T, MouseEvent>;
    onMouseOver?: NativeEventHandler<T, MouseEvent>;
    onMouseOverCapture?: NativeEventHandler<T, MouseEvent>;
    onMouseUp?: NativeEventHandler<T, MouseEvent>;
    onMouseUpCapture?: NativeEventHandler<T, MouseEvent>;

    // Selection Events
    onSelect?: NativeEventHandler<T, Event>;
    onSelectCapture?: NativeEventHandler<T, Event>;

    // Touch Events
    onTouchCancel?: NativeEventHandler<T, TouchEvent>;
    onTouchCancelCapture?: NativeEventHandler<T, TouchEvent>;
    onTouchEnd?: NativeEventHandler<T, TouchEvent>;
    onTouchEndCapture?: NativeEventHandler<T, TouchEvent>;
    onTouchMove?: NativeEventHandler<T, TouchEvent>;
    onTouchMoveCapture?: NativeEventHandler<T, TouchEvent>;
    onTouchStart?: NativeEventHandler<T, TouchEvent>;
    onTouchStartCapture?: NativeEventHandler<T, TouchEvent>;

    // Pointer Events
    onPointerDown?: NativeEventHandler<T, PointerEvent>;
    onPointerDownCapture?: NativeEventHandler<T, PointerEvent>;
    onPointerMove?: NativeEventHandler<T, PointerEvent>;
    onPointerMoveCapture?: NativeEventHandler<T, PointerEvent>;
    onPointerUp?: NativeEventHandler<T, PointerEvent>;
    onPointerUpCapture?: NativeEventHandler<T, PointerEvent>;
    onPointerCancel?: NativeEventHandler<T, PointerEvent>;
    onPointerCancelCapture?: NativeEventHandler<T, PointerEvent>;
    onPointerEnter?: NativeEventHandler<T, PointerEvent>;
    onPointerEnterCapture?: NativeEventHandler<T, PointerEvent>;
    onPointerLeave?: NativeEventHandler<T, PointerEvent>;
    onPointerLeaveCapture?: NativeEventHandler<T, PointerEvent>;
    onPointerOver?: NativeEventHandler<T, PointerEvent>;
    onPointerOverCapture?: NativeEventHandler<T, PointerEvent>;
    onPointerOut?: NativeEventHandler<T, PointerEvent>;
    onPointerOutCapture?: NativeEventHandler<T, PointerEvent>;
    onGotPointerCapture?: NativeEventHandler<T, PointerEvent>;
    onGotPointerCaptureCapture?: NativeEventHandler<T, PointerEvent>;
    onLostPointerCapture?: NativeEventHandler<T, PointerEvent>;
    onLostPointerCaptureCapture?: NativeEventHandler<T, PointerEvent>;

    // UI Events
    onScroll?: NativeEventHandler<T, UIEvent>;
    onScrollCapture?: NativeEventHandler<T, UIEvent>;

    // Wheel Events
    onWheel?: NativeEventHandler<T, WheelEvent>;
    onWheelCapture?: NativeEventHandler<T, WheelEvent>;

    // Animation Events
    onAnimationStart?: NativeEventHandler<T, AnimationEvent>;
    onAnimationStartCapture?: NativeEventHandler<T, AnimationEvent>;
    onAnimationEnd?: NativeEventHandler<T, AnimationEvent>;
    onAnimationEndCapture?: NativeEventHandler<T, AnimationEvent>;
    onAnimationIteration?: NativeEventHandler<T, AnimationEvent>;
    onAnimationIterationCapture?: NativeEventHandler<T, AnimationEvent>;

    // Transition Events
    onTransitionEnd?: NativeEventHandler<T, TransitionEvent>;
    onTransitionEndCapture?: NativeEventHandler<T, TransitionEvent>;
}


export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Tsx-air-specific Attributes
    key?: string;
    children?: TsxAirChild | TsxAirChild[];
    // Standard HTML Attributes
    accessKey?: string;
    className?: string;
    contentEditable?: boolean;
    contextMenu?: string;
    dir?: string;
    draggable?: boolean;
    hidden?: boolean;
    id?: string;
    lang?: string;
    placeholder?: string;
    slot?: string;
    spellCheck?: boolean;
    style?: CSSProperties;
    tabIndex?: number;
    title?: string;

    // Unknown
    inputMode?: string;
    is?: string;
    radioGroup?: string; // <command>, <menuitem>

    // WAI-ARIA
    role?: string;

    // RDFa Attributes
    about?: string;
    datatype?: string;
    inlist?: any;
    prefix?: string;
    property?: string;
    resource?: string;
    typeof?: string;
    vocab?: string;

    // Non-standard Attributes
    autoCapitalize?: string;
    autoCorrect?: string;
    autoSave?: string;
    color?: string;
    itemProp?: string;
    itemScope?: boolean;
    itemType?: string;
    itemID?: string;
    itemRef?: string;
    results?: number;
    security?: string;
    unselectable?: 'on' | 'off';
}

export interface ImgHTMLAttributes<T extends HTMLImageElement> extends HTMLAttributes<T> {
    alt?: string;
    crossOrigin?: 'anonymous' | 'use-credentials' | '';
    decoding?: 'async' | 'auto' | 'sync';
    height?: number | string;
    sizes?: string;
    src?: string;
    srcSet?: string;
    useMap?: string;
    width?: number | string;
}


export interface IntrinsicElements {
    a: HTMLAttributes<HTMLAnchorElement>;
    abbr: HTMLAttributes<HTMLElement>;
    address: HTMLAttributes<HTMLElement>;
    area: HTMLAttributes<HTMLAreaElement>;
    article: HTMLAttributes<HTMLElement>;
    aside: HTMLAttributes<HTMLElement>;
    audio: HTMLAttributes<HTMLAudioElement>;
    b: HTMLAttributes<HTMLElement>;
    base: HTMLAttributes<HTMLBaseElement>;
    bdi: HTMLAttributes<HTMLElement>;
    bdo: HTMLAttributes<HTMLElement>;
    big: HTMLAttributes<HTMLElement>;
    blockquote: HTMLAttributes<HTMLElement>;
    body: HTMLAttributes<HTMLBodyElement>;
    br: HTMLAttributes<HTMLBRElement>;
    button: HTMLAttributes<HTMLButtonElement>;
    canvas: HTMLAttributes<HTMLCanvasElement>;
    caption: HTMLAttributes<HTMLElement>;
    cite: HTMLAttributes<HTMLElement>;
    code: HTMLAttributes<HTMLElement>;
    col: HTMLAttributes<HTMLTableColElement>;
    colgroup: HTMLAttributes<HTMLTableColElement>;
    data: HTMLAttributes<HTMLDataElement>;
    datalist: HTMLAttributes<HTMLDataListElement>;
    dd: HTMLAttributes<HTMLElement>;
    del: HTMLAttributes<HTMLElement>;
    details: HTMLAttributes<HTMLElement>;
    dfn: HTMLAttributes<HTMLElement>;
    dialog: HTMLAttributes<HTMLDialogElement>;
    div: HTMLAttributes<HTMLDivElement>;
    dl: HTMLAttributes<HTMLDListElement>;
    dt: HTMLAttributes<HTMLElement>;
    em: HTMLAttributes<HTMLElement>;
    embed: HTMLAttributes<HTMLEmbedElement>;
    fieldset: HTMLAttributes<HTMLFieldSetElement>;
    figcaption: HTMLAttributes<HTMLElement>;
    figure: HTMLAttributes<HTMLElement>;
    footer: HTMLAttributes<HTMLElement>;
    form: HTMLAttributes<HTMLFormElement>;
    h1: HTMLAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement>;
    head: HTMLAttributes<HTMLHeadElement>;
    header: HTMLAttributes<HTMLElement>;
    hgroup: HTMLAttributes<HTMLElement>;
    hr: HTMLAttributes<HTMLHRElement>;
    html: HTMLAttributes<HTMLHtmlElement>;
    i: HTMLAttributes<HTMLElement>;
    iframe: HTMLAttributes<HTMLIFrameElement>;
    img: ImgHTMLAttributes<HTMLImageElement>;
    input: HTMLAttributes<HTMLInputElement>;
    ins: HTMLAttributes<HTMLModElement>;
    kbd: HTMLAttributes<HTMLElement>;
    keygen: HTMLAttributes<HTMLElement>;
    label: HTMLAttributes<HTMLLabelElement>;
    legend: HTMLAttributes<HTMLLegendElement>;
    li: HTMLAttributes<HTMLLIElement>;
    link: HTMLAttributes<HTMLLinkElement>;
    main: HTMLAttributes<HTMLElement>;
    map: HTMLAttributes<HTMLMapElement>;
    mark: HTMLAttributes<HTMLElement>;
    menu: HTMLAttributes<HTMLElement>;
    menuitem: HTMLAttributes<HTMLElement>;
    meta: HTMLAttributes<HTMLMetaElement>;
    meter: HTMLAttributes<HTMLElement>;
    nav: HTMLAttributes<HTMLElement>;
    noindex: HTMLAttributes<HTMLElement>;
    noscript: HTMLAttributes<HTMLElement>;
    object: HTMLAttributes<HTMLObjectElement>;
    ol: HTMLAttributes<HTMLOListElement>;
    optgroup: HTMLAttributes<HTMLOptGroupElement>;
    option: HTMLAttributes<HTMLOptionElement>;
    output: HTMLAttributes<HTMLElement>;
    p: HTMLAttributes<HTMLParagraphElement>;
    param: HTMLAttributes<HTMLParamElement>;
    picture: HTMLAttributes<HTMLElement>;
    pre: HTMLAttributes<HTMLPreElement>;
    progress: HTMLAttributes<HTMLProgressElement>;
    q: HTMLAttributes<HTMLQuoteElement>;
    rp: HTMLAttributes<HTMLElement>;
    rt: HTMLAttributes<HTMLElement>;
    ruby: HTMLAttributes<HTMLElement>;
    s: HTMLAttributes<HTMLElement>;
    samp: HTMLAttributes<HTMLElement>;
    script: HTMLAttributes<HTMLScriptElement>;
    section: HTMLAttributes<HTMLElement>;
    select: HTMLAttributes<HTMLSelectElement>;
    small: HTMLAttributes<HTMLElement>;
    source: HTMLAttributes<HTMLSourceElement>;
    span: HTMLAttributes<HTMLSpanElement>;
    strong: HTMLAttributes<HTMLElement>;
    style: HTMLAttributes<HTMLStyleElement>;
    sub: HTMLAttributes<HTMLElement>;
    summary: HTMLAttributes<HTMLElement>;
    sup: HTMLAttributes<HTMLElement>;
    table: HTMLAttributes<HTMLTableElement>;
    template: HTMLAttributes<HTMLTemplateElement>;
    tbody: HTMLAttributes<HTMLTableSectionElement>;
    td: HTMLAttributes<HTMLTableDataCellElement>;
    textarea: HTMLAttributes<HTMLTextAreaElement>;
    tfoot: HTMLAttributes<HTMLTableSectionElement>;
    th: HTMLAttributes<HTMLTableHeaderCellElement>;
    thead: HTMLAttributes<HTMLTableSectionElement>;
    time: HTMLAttributes<HTMLElement>;
    title: HTMLAttributes<HTMLTitleElement>;
    tr: HTMLAttributes<HTMLTableRowElement>;
    track: HTMLAttributes<HTMLTrackElement>;
    u: HTMLAttributes<HTMLElement>;
    ul: HTMLAttributes<HTMLUListElement>;
    'var': HTMLAttributes<HTMLElement>;
    video: HTMLAttributes<HTMLVideoElement>;
    wbr: HTMLAttributes<HTMLElement>;
    webview: HTMLAttributes<HTMLWebViewElement>;


}