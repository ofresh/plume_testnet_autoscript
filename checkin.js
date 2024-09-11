const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

// RPC-провайдер для Plume Testnet
const provider = new ethers.JsonRpcProvider("https://testnet-rpc.plumenetwork.xyz/http");

// Путь к файлу с приватными ключами
const privateKeyFilePath = path.resolve(__dirname, 'privateKeys.txt');

// Получаем цену газа
async function getGasPrice() {
    try {
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice;

        if (!gasPrice) {
            throw new Error('Не вдалося отримати дані про ціну газу.');
        }

        console.log(`Поточна ціна газу: ${gasPrice.toString()}`);

        // Додаємо 25% до ціни газу
        const increasedGasPrice = getIncreasedGasPrice(gasPrice, 25);
        console.log(`Ціна газу з 25% надбавкою: ${increasedGasPrice.toString()}`);

        return increasedGasPrice;
    } catch (error) {
        console.error("Помилка при отриманні ціни газу:", error);
        throw error;
    }
}

// Функція для отримання ціни газу з надбавкою
function getIncreasedGasPrice(gasPrice, percentage) {
    const bigGasPrice = BigInt(gasPrice.toString());
    const increase = bigGasPrice * BigInt(percentage) / BigInt(100);
    return bigGasPrice + increase;
}

// Получаем оценку газа для транзакции
async function estimateGas(tx) {
    try {
        const estimatedGas = await provider.estimateGas(tx);
        console.log(`Оцінка газу: ${estimatedGas.toString()}`);
        return BigInt(estimatedGas.toString()); // Перетворюємо в BigInt
    } catch (error) {
        console.error("Помилка при оцінці газу:", error);
        throw error;
    }
}

// Отправляем транзакцию
async function sendTransaction(wallet, tx) {
    try {
        const txResponse = await wallet.sendTransaction(tx);
        console.log(`Транзакцію відправлено з адреси ${wallet.address}. Хеш транзакції: ${txResponse.hash}`);
        return txResponse;
    } catch (error) {
        console.error(`Помилка при відправленні транзакції з адреси ${wallet.address}:`, error);
        return null;  // Повертаємо null, щоб вказати на помилку
    }
}

// Проверяем, подтверждена ли транзакция
async function checkTransactionReceipt(txHash) {
    try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.status === 1) {
            return true;
        }
        return false;
    } catch (error) {
        console.error("Помилка при отриманні даних про транзакцію:", error);
        throw error;
    }
}

// Функція для генерації випадкової затримки
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Основна функція для виконання транзакцій
async function main() {
    try {
        const gasPrice = await getGasPrice();
        const privateKeys = fs.readFileSync(privateKeyFilePath, 'utf8').trim().split('\n');

        for (const key of privateKeys) {
            const privateKey = key.trim(); // Видаляємо зайві пробіли та символи нового рядка

            if (!privateKey.startsWith('0x')) {
                console.error(`Некоректний формат приватного ключа: ${privateKey}`);
                continue;
            }

            const wallet = new ethers.Wallet(privateKey, provider);
            const nonce = await provider.getTransactionCount(wallet.address); // Отримуємо актуальний nonce

            // Визначаємо транзакцію
            const tx = {
                chainId: 161221135,  // ID мережі Plume Testnet
                to: "0x8Dc5b3f1CcC75604710d9F464e3C5D2dfCAb60d8",  // Адреса отримувача
                nonce: `0x${BigInt(nonce).toString(16)}`,  // Номер nonce у рядку
                gasPrice: `0x${BigInt(gasPrice).toString(16)}`,  // Ціна газу у рядку
                data: "0x183ff085",  // Дані транзакції
            };

            // Оцінюємо газ
            const gasLimit = await estimateGas(tx);
            tx.gasLimit = `0x${gasLimit.toString(16)}`;  // Встановлюємо ліміт газу у транзакції

            // Генеруємо випадкову затримку
            const delay = getRandomDelay(1000, 15000); // 1-15 секунд
            console.log(`Очікування ${delay / 1000} секунд перед відправкою транзакції з адреси ${wallet.address}`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // Відправляємо транзакцію
            let txResponse = await sendTransaction(wallet, tx);

            // Якщо помилка при відправленні транзакції, переходимо до наступного гаманця
            if (!txResponse) {
                console.log("Пропускаємо наступний гаманець через помилку.");
                continue;
            }

            // Очікування підтвердження транзакції
            const maxWaitTime = 60 * 1000;  // 1 хвилина в мілісекундах
            const startTime = Date.now();

            let confirmed = false;
            while (Date.now() - startTime < maxWaitTime) {
                confirmed = await checkTransactionReceipt(txResponse.hash);
                if (confirmed) {
                    console.log("Транзакцію підтверджено.");
                    break;
                }
                console.log("Очікування підтвердження транзакції...");
                await new Promise(resolve => setTimeout(resolve, 5000));  // Очікування 5 секунд перед перевіркою знову
            }

            if (!confirmed) {
                console.log("Транзакцію не підтверджено протягом 1 хвилини.");
                console.log("Повторна відправка транзакції...");
                txResponse = await sendTransaction(wallet, tx);
                if (!txResponse) {
                    console.log("Не вдалося повторно відправити транзакцію. Перехід до наступного гаманця.");
                    continue;
                }
                console.log("Транзакцію повторно відправлено. Хеш транзакції:", txResponse.hash);
            }
        }
    } catch (error) {
        console.error("Помилка при виконанні основного скрипта:", error);
    }
}

// Запускаємо скрипт
main();