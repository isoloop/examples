// The Isoloop cube and its woven ribbon, in a 1024 × 1024 design space,
// measured from the approved source (brand/source/everyday-source.webp) and
// straightened onto the isometric grid. Shapes are listed back to front.
export const VIEWBOX = '82 62 860 860';

// Cube: centre (512, 492), radius 403, so the side vertices sit at x = 512 ± 349.
export const faces = {
  top: 'M512 88L861 290L512 492L163 290Z',
  left: 'M163 290L512 492L512 895L163 693Z',
  right: 'M512 492L861 290L861 693L512 895Z',
};

// The dark openings the ribbon passes through.
export const openings = [
  'M512 195L697 302L512 409L327 302Z',
  'M300 420L512 542L512 772L300 650Z',
  'M612 546L758 461L758 690L612 776Z',
];

// The ribbon, back to front: the lower-right lobe, the big lower bowl, the
// upper-left arc, the triangle where it folds onto the left face, and the
// chevron lying on the top face, which is in front of everything.
export const ribbon = {
  lobe: 'M612 546L706 600C752 627 772 660 772 702L772 712C772 734 762 748 744 758L512 892L512 836L640 762C651 756 656 748 656 736L656 716C656 690 642 672 612 655Z',
  bowl: 'M512 505L612 546L612 622C612 722 522 826 332 828C250 829 192 780 170 700L262 693C292 712 322 722 362 722C442 722 512 680 512 600Z',
  arc: 'M448 340C340 292 260 360 258 470L258 630L356 575L356 500C356 456 364 432 376 418Z',
  fold: 'M258 630L412 541L412 705Z',
  chevron: 'M750 228L861 290L512 492L376 415L448 340L512 372Z',
};
