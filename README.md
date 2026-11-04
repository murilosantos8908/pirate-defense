# PIRATE DEFENSE

Tower Defense 3D pirata para navegador (Three.js). **Etapa 1: mapa "Ilha dos Náufragos".**

## Como executar

Precisa do Node.js instalado. Na pasta do projeto:

```
npm start
```

Abra http://localhost:8080 no navegador. (Outra porta: `PORT=3000 npm start`.)

Alternativas sem Node: `python3 -m http.server 8080` ou a extensão Live Server do VS Code.
O jogo usa módulos ES, então **não abre com duplo clique no index.html** (file://).

## Controles da câmera

- Arrastar com o botão esquerdo: girar
- Botão direito ou WASD / setas: mover
- Roda do mouse: zoom
- Q / E: girar
- Toque: um dedo gira, dois dedos fazem zoom e mover
- Esc: voltar ao menu

## Estrutura

```
index.html        página e interface
css/style.css     estilos do menu e HUD
js/config.js      cores e parâmetros do mapa e da câmera
js/utils.js       materiais, helpers e RNG
js/models.js      modelos low poly (palmeira, navio, base...)
js/map.js         montagem do mapa e animações
js/lighting.js    céu, neblina e luzes
js/camera.js      controles de câmera
js/main.js        renderizador, loop e menu
vendor/           Three.js r160 e OrbitControls (local, sem internet)
server.js         servidor estático sem dependências
```
