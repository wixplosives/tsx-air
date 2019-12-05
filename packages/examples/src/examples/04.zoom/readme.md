# Image Zoom

An interactive image zoom

## Showcases

- High framerate user interaction
- Component lifecycle
- Access to *window* (adding resize listener) via *optional* delegate
- Refs

## Notes

- The view is updated strictly by state change *ref is only used for measurements*
- To keep the example focused, calculations were moved to a helper module
- The helper is shared by source and compiled code
- To help clarity, names of refs are used in the compiled code
