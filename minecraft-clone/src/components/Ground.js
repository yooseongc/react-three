import { usePlane } from '@react-three/cannon';
import React from 'react'
import * as textures from '../textures';

import { useStore } from '../hooks/useStore';
import { RepeatWrapping } from 'three';

export default function Ground(props) {

    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0], ...props
    }));
    const [addCube, type] = useStore(state => [state.addCube, state.type]);
    const texture = textures.grass;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(100, 100);

    return (
        <mesh
            ref={ ref }
            receiveShadow
            onClick={ e => {
                e.stopPropagation();
                const { x, y, z } = e.point;
                addCube(Math.ceil(x), Math.ceil(y), Math.ceil(z), type);
            }}
        >
            <planeBufferGeometry attach="geometry" args={ [100, 100] } />
            <meshStandardMaterial map={ texture } attach="material" />
        </mesh>
    );
}
