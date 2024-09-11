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
        data: "0x095ea7b3000000000000000000000000d2aade12760d5e176f93c8f1c6ae10667c8fca8b000000000000000000000000000000000000000000000000016345785d8a0000",
        gasLimit: '0xf951',
        secondData: "0x8119c065",
        thirddata: "0x095ea7b30000000000000000000000005374cf69c5610950526c668a7b540df6686531b4000000000000000000000000000000000000000000000000016345785d8a0000",
        fourthdata: "0xe2bbb1580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016345785d8a0000",
    }
]

// Отримуємо ціну газу
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
        console.error(`Помилка при відправленні транзакції з адреси ${wallet.address}:`, error);
        return null; // Повертаємо null у випадку помилки
    }
}

// Перевіряємо, підтверджена чи транзакція
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
function toHexString(bigNumber) {
    return `0x${bigNumber.toHexString().replace(/^0x0+/, '')}`;
}

// Основна функція для виконання транзакцій
async function main() {
    try {
        const privateKeys = fs.readFileSync(privateKeyFilePath, 'utf8').trim().split('\n');

        for (const key of privateKeys) {
            const privateKey = key.trim(); // Видаляємо зайві пробіли і символи нового рядка

            if (!privateKey.startsWith('0x')) {
                console.error(`Некоректний формат приватного ключа: ${privateKey}`);
                continue;
            }

            const wallet = new ethers.Wallet(privateKey, provider);
            let nonce = await provider.getTransactionCount(wallet.address); // Отримуємо актуальний nonce
            const gasPrice = await getGasPrice(); // Отримуємо поточну ціну газу

            // Вибираємо випадкову транзакцію
            const txTemplate = transactions[Math.floor(Math.random() * transactions.length)];

            // Транзакція на апрув
            const tx1 = {
                chainId: 161221135, // ID мережі Plume Testnet
                data: txTemplate.data,
                to: "0x5c1409a46cD113b3A667Db6dF0a8D7bE37ed3BB3",
                gasLimit: txTemplate.gasLimit, // Використовуємо gasLimit з шаблону
                gasPrice: `0x${BigInt(gasPrice).toString(16)}`, // Динамічна ціна газу
                nonce: `0x${BigInt(nonce).toString(16)}`, // Номер nonce в рядку
            };

            // Генеруємо випадкову затримку перед відправленням першої транзакції
            const delay1 = getRandomDelay(1000, 15000); // 1-15 секунд
            console.log(`Очікування ${delay1 / 1000} секунд перед відправленням транзакції на апрув з адреси ${wallet.address}`);
            await new Promise(resolve => setTimeout(resolve, delay1));

            // Відправляємо першу транзакцію
            let txResponse1 = await sendTransaction(wallet, tx1);

            // Якщо помилка при відправленні транзакції, переходимо до наступного гаманця
            if (!txResponse1) {
                console.log("Пропускаємо наступний гаманець через помилку при відправленні транзакції на апрув.");
                continue;
            }

            // Очікування підтвердження транзакції
            const maxWaitTime1 = 60 * 1000;  // 1 хвилина в мілісекундах
            const startTime1 = Date.now();

            let confirmed1 = false;
            while (Date.now() - startTime1 < maxWaitTime1) {
                confirmed1 = await checkTransactionReceipt(txResponse1.hash);
                if (confirmed1) {
                    console.log("Транзакцію підтверджено. Це транзакція на апрув.");
                    break;
                }
                console.log("Очікування підтвердження транзакції...");
                await new Promise(resolve => setTimeout(resolve, 5000));  // Очікування 5 секунд перед перевіркою знову
            }

            if (!confirmed1) {
                console.log("Транзакцію не підтверджено протягом 1 хвилини.");
                console.log("Повторна відправка транзакції...");
                txResponse1 = await sendTransaction(wallet, tx1);
                if (!txResponse1) {
                    console.log("Не вдалося повторно відправити транзакцію на апрув. Перехід до наступного гаманця.");
                    continue;
                }
                console.log("Транзакція на апрув повторно відправлена. Хеш транзакції:", txResponse1.hash);
            }

            // Транзакція на стейкінг
            const tx2 = {
                chainId: 161221135, // ID мережі Plume Testnet
                data: txTemplate.secondData,
                to: "0xd2AadE12760d5e176F93C8F1C6Ae10667c8FCa8b",
                gasLimit: '0x81128', // Фіксоване значення газу для стейкінгу
                gasPrice: `0x${BigInt(gasPrice).toString(16)}`, // Фіксоване значення ціни газу для стейкінгу
                nonce: `0x${BigInt(nonce + 1).toString(16)}`, // Наступний nonce
            };

            // Відправляємо другу транзакцію відразу після підтвердження першої
            let txResponse2 = await sendTransaction(wallet, tx2);

            // Якщо помилка при відправленні другої транзакції, переходимо до наступного гаманця
            if (!txResponse2) {
                console.log("Пропускаємо наступний гаманець через помилку при відправленні другої транзакції на стейкінг.");
                continue;
            }

            // Очікування підтвердження другої транзакції
            const maxWaitTime2 = 60 * 1000;  // 1 хвилина в мілісекундах
            const startTime2 = Date.now();

            let confirmed2 = false;
            while (Date.now() - startTime2 < maxWaitTime2) {
                confirmed2 = await checkTransactionReceipt(txResponse2.hash);
                if (confirmed2) {
                    console.log("Другу транзакцію підтверджено. Це транзакція на купівлю.");
                    break;
                }
                console.log("Очікування підтвердження другої транзакції...");
                await new Promise(resolve => setTimeout(resolve, 5000));  // Очікування 5 секунд перед перевіркою знову
            }

            if (!confirmed2) {
                console.log("Другу транзакцію не підтверджено протягом 1 хвилини.");
                console.log("Повторна відправка другої транзакції...");
                txResponse2 = await sendTransaction(wallet, tx2);
                if (!txResponse2) {
                    console.log("Не вдалося повторно відправити другу транзакцію. Перехід до наступного гаманця.");
                    continue;
                }
                console.log("Друга транзакція повторно відправлена. Хеш транзакції:", txResponse2.hash);
            }

            // Транзакція на стейкінг
            const tx3 = {
                chainId: 161221135, // ID мережі Plume Testnet
                data: txTemplate.thirddata,
                to: "0x45934E0253955dE498320D67c0346793be44BEC0",
                gasLimit: '0x17157', // Фіксоване значення газу для стейкінгу
                gasPrice: `0x${BigInt(gasPrice).toString(16)}`, // Фіксоване значення ціни газу для стейкінгу
                nonce: `0x${BigInt(nonce + 2).toString(16)}`, // Наступний nonce
            };

            // Відправляємо третю транзакцію відразу після підтвердження другої
            let txResponse3 = await sendTransaction(wallet, tx3);

            // Якщо помилка при відправленні третьої транзакції, переходимо до наступного гаманця
            if (!txResponse3) {
                console.log("Пропускаємо наступний гаманець через помилку при відправленні третьої транзакції апрув.");
                continue;
            }

            // Очікування підтвердження третьої транзакції
            const maxWaitTime3 = 60 * 1000;  // 1 хвилина в мілісекундах
            const startTime3 = Date.now();

            let confirmed3 = false;
            while (Date.now() - startTime3 < maxWaitTime3) {
                confirmed3 = await checkTransactionReceipt(txResponse3.hash);
                if (confirmed3) {
                    console.log("Третю транзакцію підтверджено. Це транзакція на стейкінг.");
                    break;
                }
                console.log("Очікування підтвердження третьої транзакції...");
                await new Promise(resolve => setTimeout(resolve, 5000));  // Очікування 5 секунд перед перевіркою знову
            }

            if (!confirmed3) {
                console.log("Третю транзакцію не підтверджено протягом 1 хвилини.");
                console.log("Повторна відправка третьої транзакції...");
                txResponse3 = await sendTransaction(wallet, tx3);
                if (!txResponse3) {
                    console.log("Не вдалося повторно відправити третю транзакцію. Перехід до наступного гаманця.");
                    continue;
                }
                console.log("Третя транзакція повторно відправлена. Хеш транзакції:", txResponse3.hash);
            }

            // Транзакція на стейкінг
            const tx4 = {
                chainId: 161221135, // ID мережі Plume Testnet
                data: txTemplate.fourthdata,
                to: "0x5374Cf69C5610950526C668A7B540df6686531b4",
                gasLimit: '0x58115', // Фіксоване значення газу для стейкінгу
                gasPrice: `0x${BigInt(gasPrice).toString(16)}`, // Фіксоване значення ціни газу для стейкінгу
                nonce: `0x${BigInt(nonce + 3).toString(16)}`, // Наступний nonce
            };

            // Відправляємо четверту транзакцію відразу після підтвердження третьої
            let txResponse4 = await sendTransaction(wallet, tx4);

            // Якщо помилка при відправленні четвертої транзакції, переходимо до наступного гаманця
            if (!txResponse4) {
                console.log("Пропускаємо наступний гаманець через помилку при відправленні четвертої транзакції на стейкінг.");
                continue;
            }

            // Очікування підтвердження четвертої транзакції
            const maxWaitTime4 = 60 * 1000;  // 1 хвилина в мілісекундах
            const startTime4 = Date.now();

            let confirmed4 = false;
            while (Date.now() - startTime4 < maxWaitTime4) {
                confirmed4 = await checkTransactionReceipt(txResponse4.hash);
                if (confirmed4) {
                    console.log("Четверту транзакцію підтверджено. Це транзакція на стейкінг.");
                    break;
                }
                console.log("Очікування підтвердження четвертої транзакції...");
                await new Promise(resolve => setTimeout(resolve, 5000));  // Очікування 5 секунд перед перевіркою знову
            }

            if (!confirmed4) {
                console.log("Четверту транзакцію не підтверджено протягом 1 хвилини.");
                console.log("Повторна відправка четвертої транзакції...");
                txResponse4 = await sendTransaction(wallet, tx4);
                if (!txResponse4) {
                    console.log("Не вдалося повторно відправити четверту транзакцію. Перехід до наступного гаманця.");
                    continue;
                }
                console.log("Четверта транзакція повторно відправлена. Хеш транзакції:", txResponse4.hash);
            }

            // Збільшуємо nonce для наступного циклу
            nonce += 4; // Один nonce для кожної транзакції

            // Генеруємо випадкову затримку перед переходом до наступного гаманця
            const delay2 = getRandomDelay(1000, 15000); // 1-15 секунд
            console.log(`Очікування ${delay2 / 1000} секунд перед переходом до наступного гаманця.`);
            await new Promise(resolve => setTimeout(resolve, delay2));
        }
    } catch (error) {
        console.error("Помилка при виконанні основного скрипта:", error);
    }
}

// Запускаємо скрипт
main();