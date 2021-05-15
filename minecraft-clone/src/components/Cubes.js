import React from 'react'
import { useInterval } from '../hooks/useInterval';
import { useStore } from '../hooks/useStore';
import Cube from './Cube';

export default function Cubes() {

    const [cubes, addCube, removeCube, saveWorld] = useStore(state => [
        state.cubes,
        state.addCube,
        state.removeCube,
        state.saveWorld
    ]);

    useInterval(
        () => {
            saveWorld();
        },
        10000
    );

    return cubes.map(cube => (
        <Cube 
            key={ cube.key } 
            position={ cube.pos } 
            texture={ cube.texture }
            addCube={ addCube }
            removeCube={ removeCube } 
        />
    ));
}
