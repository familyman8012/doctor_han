import type React from "react";
import { useSyncExternalStore } from "react";
import ReactDOM from "react-dom";

// SSR-safe document.body subscription
const subscribe = () => () => {};
const getSnapshot = () => (typeof document !== "undefined" ? document.body : null);
const getServerSnapshot = () => null;

const Portal = ({ children }: React.PropsWithChildren) => {
    const portalRoot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    if (!portalRoot) {
        return null;
    }

    return ReactDOM.createPortal(children, portalRoot);
};

export default Portal;
