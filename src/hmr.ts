import { NgModuleRef, ApplicationRef } from '@angular/core';
import { createNewHosts } from '@angularclass/hmr';

export const hmrBootstrap = (module: any, bootstrap: () => Promise<NgModuleRef<any>>) => {
    module.hot.accept();

    let ngModule: NgModuleRef<any>;
    bootstrap().then(currentModule => ngModule = currentModule);
    /** function called when we make some changes in code */
    module.hot.dispose(() => {
        const appRef = ngModule.injector.get(ApplicationRef);
        const elements = appRef.components.map(component => component.location.nativeElement);
        const removeOldHosts = createNewHosts(elements);
        ngModule.destroy();
        removeOldHosts();
    });
};
