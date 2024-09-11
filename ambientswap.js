const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

// RPC-провайдер для Plume Testnet
const provider = new ethers.JsonRpcProvider("https://testnet-rpc.plumenetwork.xyz/http");

// Путь к файлу с приватными ключами
const privateKeyFilePath = path.resolve(__dirname, 'privateKeys.txt');

// Определяем две транзакции с фиксированным `gasLimit`
const transactions = [
  {
    data: "0x3d719cd90000000000000000000000005c1409a46cd113b3a667db6df0a8d7be37ed3bb3000000000000000000000000ba22114ec75f0d55c34a5e5a3cf384484ad9e7330000000000000000000000000000000000000000000000000000000000008ca000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100010000000000000000000000000000000000000000000000008945c3b72d348a600000000000000000000000000000000000000000000000000000000000000000",
    gasLimit: '0x835c7', 
  },
  {
    data: "0x3d719cd90000000000000000000000005c1409a46cd113b3a667db6df0a8d7be37ed3bb3000000000000000000000000ba22114ec75f0d55c34a5e5a3cf384484ad9e7330000000000000000000000000000000000000000000000000000000000008ca00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000470de4df82000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001000000000000000000000000000000000000000000000001128c3bc09baa86b00000000000000000000000000000000000000000000000000000000000000000",
    gasLimit: '0x835c7', 
  },
   {
    data: "0x3d719cd90000000000000000000000005c1409a46cd113b3a667db6df0a8d7be37ed3bb3000000000000000000000000ba22114ec75f0d55c34a5e5a3cf384484ad9e7330000000000000000000000000000000000000000000000000000000000008ca000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006a94d74f430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100010000000000000000000000000000000000000000000000019bd2b3f82ce555e00000000000000000000000000000000000000000000000000000000000000000",
    gasLimit: '0x835c7', 
  },
  {
    data: "0x3d719cd90000000000000000000000005c1409a46cd113b3a667db6df0a8d7be37ed3bb3000000000000000000000000ba22114ec75f0d55c34a5e5a3cf384484ad9e7330000000000000000000000000000000000000000000000000000000000008ca000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008e1bc9bf0400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000100000000000000000000000000000000000000000000000225192bd36de953e80000000000000000000000000000000000000000000000000000000000000000",
    gasLimit: '0x835c7', 
  },
   {
    data: "0x3d719cd90000000000000000000000005c1409a46cd113b3a667db6df0a8d7be37ed3bb3000000000000000000000000ba22114ec75f0d55c34a5e5a3cf384484ad9e7330000000000000000000000000000000000000000000000000000000000008ca00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b1a2bc2ec5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001000000000000000000000000000000000000000000000002ae5fa3aed683df400000000000000000000000000000000000000000000000000000000000000000",
    gasLimit: '0x835c7', 
  },
  {
    data: "0x3d719cd90000000000000000000000005c1409a46cd113b3a667db6df0a8d7be37ed3bb3000000000000000000000000ba22114ec75f0d55c34a5e5a3cf384484ad9e7330000000000000000000000000000000000000000000000000000000000008ca00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d529ae9e8600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000100000000000000000000000000000000000000000000000337a61c146f2995200000000000000000000000000000000000000000000000000000000000000000",
    gasLimit: '0x835c7', 
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

// Відправляємо транзакцію
async function sendTransaction(wallet, tx) {
    try {
        const txResponse = await wallet.sendTransaction(tx);
        console.log(`Транзакцію відправлено з адреси ${wallet.address}. Хеш транзакції: ${txResponse.hash}`);
        return txResponse;
    } catch (error) {
        console.error("Помилка при відправленні транзакції:", error);
        throw error;
    }
}

// Перевіряємо, чи підтверджена транзакція
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
            const privateKey = key.trim(); // Видаляємо зайві пробіли та символи нового рядка

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
                to: "0x4c722A53Cf9EB5373c655E1dD2dA95AcC10152D1",
                gasLimit: txTemplate.gasLimit, // Використовуємо gasLimit з шаблону
                gasPrice: `0x${BigInt(gasPrice).toString(16)}`, // Динамічна ціна газу
                nonce: `0x${BigInt(nonce).toString(16)}`, // Номер nonce в рядку
            };

            // Генеруємо випадкову затримку
            const delay = getRandomDelay(1000, 15000); // 1-15 секунд
            console.log(`Очікування ${delay / 1000} секунд перед відправкою транзакції з адреси ${wallet.address}`);
            await new Promise(resolve => setTimeout(resolve, delay));

            try {
                // Відправляємо транзакцію
                const txResponse = await sendTransaction(wallet, tx);

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
                }
            } catch (error) {
                console.error("Помилка при обробці транзакції. Перехід до наступного гаманця:", error);
            }
        }
    } catch (error) {
        console.error("Помилка при виконанні основного скрипта:", error);
    }
}

// Запускаємо скрипт
main();