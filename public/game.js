window.addEventListener("DOMContentLoaded", () => {
  let playerName = "Player";
  let timeLeft = 30;

  window.startGame = function () {
    playerName = document.getElementById("playerNameInput").value.trim() || "Player";
    timeLeft = parseInt(document.getElementById("gameTime").value) || 30;
    document.getElementById("nameOverlay").style.display = "none";
    initGame();
  };

  function initGame() {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("cam", Math.PI / 2, Math.PI / 3, 15, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);
    scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), new BABYLON.CannonJSPlugin());

    scene.registerBeforeRender(() => {
      const t = performance.now() / 5000;
      const i = Math.abs(Math.sin(t));
      light.intensity = 0.3 + i * 0.7;
      scene.clearColor = new BABYLON.Color4(0.2 + i * 0.5, 0.4 + i * 0.5, 0.6 + i * 0.3, 1);
    });

    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("ground", "", {
      width: 20, height: 20, subdivisions: 50, minHeight: 0, maxHeight: 2,
      onReady: () => {
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.HeightmapImpostor, { mass: 0 });
      }
    }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.3);
    ground.material = groundMat;

    const player = BABYLON.MeshBuilder.CreateSphere("player", { diameter: 1 }, scene);
    player.position = new BABYLON.Vector3(0, 2, 0);
    player.material = new BABYLON.StandardMaterial("playerMat", scene);
    player.material.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.SphereImpostor, {
      mass: 1, friction: 0.6, restitution: 0.4
    }, scene);
    camera.lockedTarget = player;

    let score = 0;
    const scoreText = document.getElementById("score");
    const timeText = document.getElementById("time");
    const playersText = document.getElementById("players");
    const scoreboard = document.getElementById("scoreboard");
    const finalScoreText = document.getElementById("finalScore");

    const keys = {};
    window.addEventListener("keydown", (e) => keys[e.code] = true);
    window.addEventListener("keyup", (e) => keys[e.code] = false);
    scene.onBeforeRenderObservable.add(() => {
      const impulse = new BABYLON.Vector3(
        (keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0),
        0,
        (keys["ArrowDown"] ? 1 : 0) - (keys["ArrowUp"] ? 1 : 0)
      ).normalize().scale(1.5);
      if (impulse.length() > 0) {
        player.physicsImpostor.applyImpulse(impulse, player.getAbsolutePosition());
      }
    });

    function spawnCollectible() {
      const orb = BABYLON.MeshBuilder.CreateSphere("collectible", { diameter: 0.5 }, scene);
      orb.position = new BABYLON.Vector3(Math.random() * 14 - 7, 0.5, Math.random() * 14 - 7);
      orb.material = new BABYLON.StandardMaterial("mat", scene);
      orb.material.diffuseColor = new BABYLON.Color3(1, 1, 0);
      scene.onBeforeRenderObservable.add(() => {
        if (BABYLON.Vector3.Distance(orb.position, player.position) < 1) {
          score++; scoreText.textContent = score;
          orb.dispose();
        }
      });
    }
    setInterval(spawnCollectible, 3000);

    function spawnHazard() {
      const enemy = BABYLON.MeshBuilder.CreateBox("enemy", { size: 1 }, scene);
      enemy.position = new BABYLON.Vector3(Math.random() * 14 - 7, 0.5, Math.random() * 14 - 7);
      enemy.material = new BABYLON.StandardMaterial("enemyMat", scene);
      enemy.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
      const dir = new BABYLON.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().scale(0.1);
      scene.onBeforeRenderObservable.add(() => {
        enemy.position.addInPlace(dir);
        if (BABYLON.Vector3.Distance(enemy.position, player.position) < 1.1) {
          score = Math.max(0, score - 1);
          scoreText.textContent = score;
        }
      });
    }
    setInterval(spawnHazard, 7000);

    const goal = BABYLON.MeshBuilder.CreateDisc("goal", { radius: 1 }, scene);
    goal.rotation.x = Math.PI / 2;
    goal.position = new BABYLON.Vector3(8, 0.05, 8);
    goal.material = new BABYLON.StandardMaterial("goalMat", scene);
    goal.material.diffuseColor = new BABYLON.Color3(0, 1, 1);

    const gameInterval = setInterval(() => {
      timeLeft--;
      timeText.textContent = timeLeft;

      if (BABYLON.Vector3.Distance(goal.position, player.position) < 1) {
        endGame("🎯 You Win!");
      }

      if (timeLeft <= 0) {
        endGame("⏱️ Time's Up!");
      }
    }, 1000);

    function endGame(message) {
      clearInterval(gameInterval);
      finalScoreText.textContent = score;
      scoreboard.style.display = "block";

      const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
      leaderboard.push({ name: playerName, score });
      leaderboard.sort((a, b) => b.score - a.score);
      localStorage.setItem("leaderboard", JSON.stringify(leaderboard.slice(0, 5)));

      const boardHTML = leaderboard
        .slice(0, 5)
        .map((p, i) => `<div>${i + 1}. ${p.name}: ${p.score}</div>`)
        .join("");

      scoreboard.innerHTML += `<hr><strong>${message}</strong>`;
      scoreboard.innerHTML += `<hr><strong>Leaderboard:</strong><div>${boardHTML}</div>`;
      scoreboard.innerHTML += `<br><em>Press SPACE to restart</em>`;

      document.addEventListener("keydown", (e) => {
        if (e.code === "Space") location.reload();
      });
    }

    const socket = new WebSocket("wss://public-babylonjs-game.onrender.com");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "players") {
        playersText.textContent = data.count;
      }
    };

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
  }
});
