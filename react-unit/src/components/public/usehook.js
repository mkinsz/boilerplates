import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react'

// self use hook test
const useResize = () => {
    const [size, setSize] = useState({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
    })

    const handleResize = useCallback(() => {
        setSize({
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        })
    }, [])

    useEffect(() => {
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [handleResize])

    return size
}

const getSize = el => {
    if (!el) return {};
    return {
        width: el.offsetWidth,
        height: el.offsetHeight
    };
}

const useComponentResize = ref => {
    const [ComponentSize, setComponentSize] = useState(getSize(ref.current));

    const handleResize = () => {
        if (ref && ref.current) {
            setComponentSize(getSize(ref.current));
        }
    }

    useLayoutEffect(() => {
        let resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(ref.current);

        return () => {
            resizeObserver.unobserve(ref.current)
            resizeObserver.disconnect(ref.current);
            resizeObserver = null;
        };
    }, []);

    return ComponentSize;
}

const useMeasure = () => {
    const [rect, setRect] = React.useState();
    const ref = useCallback(node => {
        if (node) setRect(node.getBoundingClientRect())
        return node;
    }, [])

    return [rect, ref]
}

const useForceUpdate = () => {
    return React.useReducer(() => ({}))[1]
}

const useMousePosition = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    useEffect(() => {
        const updateMouse = (e) => {
            setPosition({ x: e.clientX, y: e.clientY })
        }
        document.addEventListener('mousemove', updateMouse)
        return () => {
            document.removeEventListener('mousemove', updateMouse)
        }
    })
    return position
}

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(
        () => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);
            return () => {
                clearTimeout(handler);
            };
        },
        [delay, value]
    );

    return debouncedValue;
}

export { useResize, useComponentResize, useMeasure, useForceUpdate, useMousePosition, useDebounce }