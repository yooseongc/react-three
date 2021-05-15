import { extend, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PointerLockControls as PointerLockControlsImpl } from 'three/examples/jsm/controls/PointerLockControls';

extend({ PointerLockControlsImpl });

export const FPVControls = (props) => {

    const { camera, gl } = useThree();
    const controls = useRef();

    useEffect(() => {
        function lockControls() {
            controls.current.lock();
        }
        document.addEventListener('click', lockControls);
        return () => {
            document.removeEventListener('click', lockControls);
        }
    }, []);
    return (
        <pointerLockControlsImpl 
            ref={ controls }
            args={ [camera, gl.domElement] }
            {...props}
        />
    );
}