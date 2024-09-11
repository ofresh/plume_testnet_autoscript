const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

// RPC-провайдер для Plume Testnet
const provider = new ethers.JsonRpcProvider("https://testnet-rpc.plumenetwork.xyz/http");

// Путь к файлу с приватными ключами
const privateKeyFilePath = path.resolve(__dirname, 'privateKeys.txt');

// Определяем несколько транзакций с фиксированным `gasLimit`
const transactions = [
  {
    data: "0xe940f6a900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
    gasLimit: '0x835c7', // 539,639
  },
  {
    data: "0xe940f6a900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    gasLimit: '0x835c7', // 57,235
  }
];

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

// Отправляем транзакцию
async function sendTransaction(wallet, tx) {
    try {
        const txResponse = await wallet.sendTransaction(tx);
        console.log(`Транзакцію відправлено з адреси ${wallet.address}. Хеш транзакції: ${txResponse.hash}`);
        return txResponse;
    } catch (error) {
        console.error("Помилка при відправці транзакції:", error);
        throw error;
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
        const privateKeys = fs.readFileSync(privateKeyFilePath, 'utf8').trim().split('\n');

        for (const key of privateKeys) {
            const privateKey = key.trim(); // Убираємо зайві пробіли та символи нового рядка

            if (!privateKey.startsWith('0x')) {
                console.error(`Некоректний формат приватного ключа: ${privateKey}`);
                continue;
            }

            const wallet = new ethers.Wallet(privateKey, provider);
            const nonce = await provider.getTransactionCount(wallet.address); // Отримуємо актуальний nonce
            const gasPrice = await getGasPrice(); // Отримуємо поточну ціну газу

            // Вибираємо випадкову транзакцію
            const txTemplate = transactions[Math.floor(Math.random() * transactions.length)];

            // Копіюємо шаблон транзакції та додаємо необхідні параметри
            const tx = {
                chainId: 161221135, // ID мережі Plume Testnet
                data: txTemplate.data,
                to: "0x032139f44650481f4d6000c078820B8E734bF253",
                gasLimit: txTemplate.gasLimit, // Використовуємо gasLimit з шаблону
                gasPrice: `0x${BigInt(gasPrice).toString(16)}`, // Динамічна ціна газу
                nonce: `0x${BigInt(nonce).toString(16)}`, // Номер nonce у рядку
            };

            try {
                // Генеруємо випадкову затримку
                const delay = getRandomDelay(1000, 15000); // 1-15 секунд
                console.log(`Очікування ${delay / 1000} секунд перед відправкою транзакції з адреси ${wallet.address}`);
                await new Promise(resolve => setTimeout(resolve, delay));

                // Відправляємо транзакцію
                let txResponse = await sendTransaction(wallet, tx);

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
                    console.log("Транзакцію повторно відправлено. Хеш транзакції:", txResponse.hash);
                }
            } catch (txError) {
                console.error("Помилка при обробці транзакції:", txError);
            }

            // Переходимо до наступного ключа
            console.log("Переходжу до наступного гаманця...");
        }
    } catch (error) {
        console.error("Помилка при виконанні основного скрипта:", error);
    }
}

// Запускаємо скрипт
main();