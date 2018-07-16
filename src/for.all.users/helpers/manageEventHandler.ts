export function addEventHandler(object: object, event: string, callback: Function) {
    if (object === null || object === undefined) { return; }
    if (object['addEventListener']) {
        object['addEventListener'](event, callback, false);
    } else {
        if (object['attachEvent']) {
            object['attachEvent'](`on${event}`, callback);
        }
    }
}

export function removeEventHandler(object: object, event: string, callback: Function) {
    if (object === null || object === undefined) { return; }
    if (object['removeEventListener']) {
        object['removeEventListener'](event, callback);
    } else {
        if (object['detachEvent']) {
            object['detachEvent'](`on${event}`, callback);
        }
    }
}
