import { useEffect, useRef } from "react";

export const useStateRef = <T>(state: T) => {
    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    return stateRef;
};
