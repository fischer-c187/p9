#!/bin/bash

# Nom du script : manage_project.sh
PID_FILE=".pid"
BACK_LOG=".back.log"
FRONT_LOG=".front.log"

function start_project() {
    if [ -f "$PID_FILE" ]; then
        echo "Les serveurs sont déjà en cours d'exécution."
        exit 1
    fi

    echo "Démarrage du back-end..."
    (cd Billed-app-FR-Back && npm run run:dev >> "../.back.log" 2>&1 & echo $! >> "$PID_FILE")
    sleep 2
    BACK_PID=$(head -n 1 "$PID_FILE")
    if ! ps -p "$BACK_PID" > /dev/null; then
        echo "Erreur lors du démarrage du back-end. Vérifiez .back.log pour plus d'informations."
        rm -f "$PID_FILE"
        exit 1
    fi

    echo "Démarrage du front-end..."
    (cd Billed-app-FR-Front && live-server >> "../.front.log" 2>&1 & echo $! >> "$PID_FILE")
    sleep 2
    FRONT_PID=$(tail -n 1 "$PID_FILE")
    if ! ps -p "$FRONT_PID" > /dev/null; then
        echo "Erreur lors du démarrage du front-end. Vérifiez .front.log pour plus d'informations."
        rm -f "$PID_FILE"
        exit 1
    fi

    echo "Les serveurs ont été démarrés."
}

function stop_project() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Aucun serveur en cours d'exécution détecté."
        exit 1
    fi

    echo "Arrêt du back-end et du front-end..."
    while IFS= read -r pid; do
        kill -9 "$pid"
    done <"$PID_FILE"

    rm -f "$PID_FILE"
}

if [ "$1" == "start" ]; then
    start_project
elif [ "$1" == "stop" ]; then
    stop_project
else
    echo "Usage: ./manage_project.sh [start|stop]"
fi

