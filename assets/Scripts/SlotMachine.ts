
import { _decorator, Component, Node, Animation, SpriteFrame, Sprite, math, animation, find } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;


@ccclass('SlotMachine')
export class SlotMachine extends Component {

    private gameManager: GameManager = null!;

    @property({
        type: Node
    })
    rodilloLeftNode: Node = null!;

    @property({
        type: Node
    })
    rodilloMidNode: Node = null!;

    @property({
        type: Node
    })
    rodilloRightNode: Node = null!;

    @property({
        type: Node
    })
    wonWindow: Node = null!;

    @property({
        type: SpriteFrame
    })
    BigWin: SpriteFrame = null!;

    @property({
        type: SpriteFrame
    })
    Fresa: SpriteFrame = null!;

    @property({
        type: SpriteFrame
    })
    Siete: SpriteFrame = null!;

    @property({
        type: SpriteFrame
    })
    Limon: SpriteFrame = null!;

    @property({
        type: SpriteFrame
    })
    Mora: SpriteFrame = null!;

    @property({
        type: SpriteFrame
    })
    SlotMachine: SpriteFrame = null!;

    @property({
        type: Number
    })
    distanceBetweenIcones: number = 125; //distancia entre iconos en p�xeles

    timeBetweenSpines: number = 2000; //in ms

    maxSpinSpeed: number = 2; 
    rodillosStopped = 0;

    actualSymbols = [];

    canISpin = true;

    
    //Creo Matrices para los rodillos l�gica y Nodos para cambiar iconos
    rodillosLogic = [];
    rodillosNodes = [];


    onLoad () {
        this.loadRodillos();

        const gameManagerNode = find("GameManager");
        this.gameManager = gameManagerNode.getComponent("GameManager");
    }

    goHome() {
        this.gameManager.changeScene("Menu");
    }

    public playButton() {
        if (!this.canISpin) return;
        this.spinRodillos();
    }


    loadRodillos = () => {
        //Tenemos unos valores predefinidos para los iconos, pero podr�a extraerse los iconos y la cantidad de ellos de un JSON
        const rodilloLeft = ["Siete", "Mora", "BigWin", "Fresa", "Limon", "SlotMachine"];
        const rodilloMid = ["Siete", "SlotMachine", "Mora", "Limon", "BigWin", "Fresa"];
        const rodilloRight = ["Siete", "BigWin", "SlotMachine", "Mora", "Fresa", "Limon"];

        this.rodillosLogic = [rodilloLeft, rodilloMid, rodilloRight];
        this.rodillosNodes = [this.rodilloLeftNode, this.rodilloMidNode, this.rodilloRightNode]


        //Cargamos los iconos
        for (let j = 0; j < this.rodillosNodes.length; j++) {
            for (let i = 0; i < (this.rodillosLogic[j].length) * 2; i++) {

                let indexIcon = i;

                if (indexIcon >= this.rodillosLogic[j].length) {
                    // Para el truco de duplicar los rollos y tenemos que restar el tama�o del rollo cuando llegamos al l�mite
                    indexIcon = indexIcon - this.rodillosLogic[j].length;
                }
                const icon = this.rodillosLogic[j][indexIcon]; // seleccionamos el string del icono de la lista que tiene que coincidir con el nombre de las properties antes creadas
                this.rodillosNodes[j].getChildByName(i.toString()).getComponent(Sprite).spriteFrame = this[icon]; // Cambiamos el spire
            }
        }

    }

    spinRodillos = async () =>{

        this.canISpin = false;
        this.rodillosStopped = 0;

        function getRndInteger(max) {
            return Math.floor(Math.random() * (max));
        }
        //Seleccion RANDOM posicion
        for (let i = 0; i < this.rodillosLogic.length; i++) {

            const randomNumber = getRndInteger(this.rodillosLogic[i].length)
            console.log(this.rodillosLogic[i][randomNumber]);

            this.actualSymbols[i] = this.rodillosLogic[i][randomNumber];
            

            this.animateRodillo(this.rodillosNodes[i], randomNumber, this.distanceBetweenIcones, this.maxSpinSpeed); //Llamamos a animacion
            await new Promise(resolve => setTimeout(resolve, this.timeBetweenSpines)); //Esperamos para ranzomizar el siguiente rodillo tiempo predefinido
        }
    }



    animateRodillo = async (rodillo: Node, result: number, distance: number, maxSpinSpeed: number) => {

        
        const animationRodillo = rodillo.getComponent(Animation);    
        const animationState = animationRodillo.getState("rodilloRoll");

        //Reseteamos valores animacion 
        animationState.wrapMode = 1; 
        animationState.repeatCount = 100;
        animationState.speed = 0.1;
        animationRodillo.play();

        

        await accelerate(animationState, animationState.speed, maxSpinSpeed); //Aceleraci�n inicio animaci�n

        async function accelerate(animState, animSpeed: number, maxSpinSpeed: number) {
            animSpeed += 0.1;
            animState.speed = animSpeed;

            if (animSpeed < 2) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                await accelerate(animState, animSpeed, maxSpinSpeed);
            }
            else {
                //En velocidad m�xima definido por max

               
                rodillo.getParent().getParent().setPosition(0, distance * -result, 0); //Colocamos el padre para que la figura quede en el centro

                if (result > 2) rodillo.getParent().getParent().setPosition(0, (rodillo.getParent().getParent().position.y) - (125 * -6), 0); 

                await deAccelerate(animState, animSpeed, animationState);
            }
        }

        async function deAccelerate(animState, animSpeed, animationState) {
            animSpeed -= 0.1;
            animState.speed = animSpeed;

            if (animSpeed > 0.2) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                await deAccelerate(animState, animSpeed, animationState);
            } else if (animSpeed > 0.1) {

                await new Promise((resolve) => setTimeout(resolve, 600));
                await deAccelerate(animState, animSpeed, animationState);
                animationState.repeatCount = 1; // La velocidad es baja y hacemos que se hagan 2 repeticiones m�s hasta parar

            }
        }

        this.finishAnimation();

    }        

    finishAnimation = () =>{


        this.rodillosStopped++;

        if (this.rodillosStopped < 2) return;

        console.log("Trying to win");

        console.log(this.actualSymbols[0]);

        if (this.actualSymbols[0] == this.actualSymbols[1] && this.actualSymbols[1] == this.actualSymbols[2]) {
            this.showWonWindow();
            return;
        }
        this.canISpin = true;
    }

    showWonWindow = async () => {

        await new Promise(resolve => setTimeout(resolve, 3000));
        this.wonWindow.active = true;
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.wonWindow.active = false;
        this.canISpin = true;
    }

}


