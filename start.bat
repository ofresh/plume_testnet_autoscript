@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Убедитесь, что файл сохраняется в кодировке UTF-8 без BOM
:: и командная строка использует кодировку 65001

:: Отображаем описание и инструкции
cls
echo *******************************************
echo *               Привіт                    *
echo *       Для запуску нажми enter           *
echo *  Далі вибери цифру і нажми знову enter  *
echo *******************************************
echo.
echo Скріпт виконує певні дії в тестнеті Plume
echo Телеграм https://t.me/ofreshablecrypto
echo Автор Ofreshable
echo Перед початком прочитай інструкцію
echo.
pause

:MENU
cls
echo 1. Чекін checkin
echo 2. Свап swap
echo 3. Предікт predict
echo 4. Стейк stake
echo 5. Ленд lend
echo 6. Лендшейр lendshare
echo 7. Реалітіх realtyx
echo 8. Запустити всі по черзі runall
echo 9. Запустити всі крім чекін runall without checkin
echo 10. Вихід
echo.
set /p choice=Введи цифру і нажми Enter (1-10):

if "%choice%"=="1" goto RUN_SCRIPT1
if "%choice%"=="2" goto RUN_SCRIPT4
if "%choice%"=="3" goto RUN_SCRIPT3
if "%choice%"=="4" goto RUN_SCRIPT2
if "%choice%"=="5" goto RUN_SCRIPT5
if "%choice%"=="6" goto RUN_SCRIPT6
if "%choice%"=="7" goto RUN_SCRIPT8
if "%choice%"=="8" goto RUN_ALL
if "%choice%"=="9" goto RUN_SCRIPT7
if "%choice%"=="10" goto END

goto MENU

:RUN_SCRIPT1
echo Running Script 1 - checkin.js...
npm run script1
echo.
pause
goto MENU

:RUN_SCRIPT2
echo Running Script 4 - ambientswap.js...
npm run script4
echo.
pause
goto MENU

:RUN_SCRIPT3
echo Running Script 3 - cultured.js...
npm run script3
echo.
pause
goto MENU

:RUN_SCRIPT4
echo Running Script 2 - nest.js...
npm run script4
echo.
pause
goto MENU

:RUN_SCRIPT5
echo Running Script 5 - lend.js...
npm run script5
echo.
pause
goto MENU

:RUN_SCRIPT6
echo Running Script 6 - landshare.js...
npm run script6
echo.
pause
goto MENU

:RUN_SCRIPT7
echo Running All scripts without checkin
npm run script7
echo.
pause
goto MENU

:RUN_SCRIPT8
echo Running Script 8 - realtyx.js...
npm run script8
echo.
pause
goto MENU


:RUN_ALL
echo Running All Scripts...
npm run runAll
echo.
pause
goto MENU

:END
echo Exiting...
pause