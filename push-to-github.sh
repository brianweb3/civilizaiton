#!/bin/bash

# Скрипт для пуша проекта на GitHub
# Замените YOUR_USERNAME на ваш GitHub username

GITHUB_USERNAME="YOUR_USERNAME"  # <-- ЗАМЕНИТЕ НА ВАШ USERNAME
REPO_NAME="civilizaiton"

echo "Настройка remote..."
git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git 2>/dev/null || git remote set-url origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

echo "Пуш кода на GitHub..."
git branch -M main
git push -u origin main

echo "Готово! Репозиторий: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
