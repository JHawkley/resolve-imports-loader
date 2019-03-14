import theFirstFunc from './myFirstFunc';
import defaultFirstFunc from './defaultExport';
import { default as byNameDefaultImportFunc } from './myFirstFunc';
import { mySecondFunc } from './mySecondFunc';
import { myExportedSecondFunc } from './reexport';
import { FOO } from './constants';
import * as things from './constants';
import transformedCss from './styles.css';

export { default as byNameDefaultExportFunc } from './myFirstFunc';
export { default as byNameDefaultNestedFunc } from './defaultExport';
export { myInlineFirstFunc as theInlineFirstFunc } from './reexport';

// export-from an un-aliased function multiple times
export { myThirdFunc } from './reexport';

// confusingly named export
export { myExportedSecondFunc as FOO } from './reexport';

export {
    theFirstFunc,
    mySecondFunc as theSecondFunc,
    byNameDefaultImportFunc,
    myExportedSecondFunc as theExportedSecondFunc,
    defaultFirstFunc,
    things as thangs,
    transformedCss,
};

export default () => console.log('default export');
