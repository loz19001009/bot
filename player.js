const { Riffy } = require("riffy");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { queueNames } = require("./commands/play"); 

function initializePlayer(client) {
    const nodes = [
        {
            host: "lava-v4.ajieblogs.eu.org",
            password: "https://dsc.gg/ajidevserver",
            port: 443,
            secure: true
        },
    ];

    client.riffy = new Riffy(client, nodes, {
        send: (payload) => {
            const guildId = payload.d.guild_id;
            if (!guildId) return;

            const guild = client.guilds.cache.get(guildId);
            if (guild) guild.shard.send(payload);
        },
        defaultSearchPlatform: "spsearch",
        restVersion: "v4"
    });

    client.riffy.on("nodeConnect", node => {
        console.log(`Node "${node.name}" connected.`);
    });

    client.riffy.on("nodeError", (node, error) => {
        console.error(`Node "${node.name}" encountered an error: ${error.message}.`);
    });

    client.riffy.on("trackStart", async (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);

   
        const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setAuthor({
            name: 'Đang phát',
            iconURL: 'https://cdn.discordapp.com/attachments/1230824451990622299/1236664581364125787/music-play.gif?ex=6638d524&is=663783a4&hm=5179f7d8fcd18edc1f7d0291bea486b1f9ce69f19df8a96303b75505e18baa3a&', 
            url: 'https://discord.gg/xQF9f9yUEM'
        })
        .setDescription(`➡️ **Tên bài hát:** [${track.info.title}](${track.info.uri})\n➡️ **Tác giả:** ${track.info.author}\n➡️ **Nền tảng:** YouTube, Spotify, SoundCloud`)
        .setImage(`https://cdn.discordapp.com/attachments/1004341381784944703/1165201249331855380/RainbowLine.gif?ex=663939fa&is=6637e87a&hm=e02431de164b901e07b55d8f8898ca5b1b2832ad11985cecc3aa229a7598d610&`)
        .setThumbnail(track.info.thumbnail)
        .setTimestamp()
        .setFooter({ text: 'Nhấn vào các nút bên dưới để điều khiển phát nhạc!'});

        const queueLoopButton = new ButtonBuilder()
            .setCustomId("loopQueue")
            .setLabel("Lặp hàng chờ")
            .setStyle(ButtonStyle.Primary);

        const disableLoopButton = new ButtonBuilder()
            .setCustomId("disableLoop")
            .setLabel("Tắt lặp")
            .setStyle(ButtonStyle.Primary);

        const stopButton = new ButtonBuilder()  // Thay đổi "skipButton" thành "stopButton"
            .setCustomId("stopTrack")
            .setLabel("Bỏ qua")
            .setStyle(ButtonStyle.Success);

        const showQueueButton = new ButtonBuilder()
            .setCustomId("showQueue")
            .setLabel("Hiển thị hàng chờ")
            .setStyle(ButtonStyle.Primary);

        const clearQueueButton = new ButtonBuilder()
            .setCustomId("clearQueue")
            .setLabel("Xóa hàng chờ")
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder()
            .addComponents(queueLoopButton, disableLoopButton, showQueueButton, clearQueueButton, stopButton);  // Thay đổi "skipButton" thành "stopButton"

        const message = await channel.send({ embeds: [embed], components: [actionRow] });

        const filter = i => i.customId === 'loopQueue' || i.customId === 'stopTrack' || i.customId === 'disableLoop' || i.customId === 'showQueue' || i.customId === 'clearQueue';
        const collector = message.createMessageComponentCollector({ filter, time: 180000 });

        setTimeout(() => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    queueLoopButton.setDisabled(true),
                    disableLoopButton.setDisabled(true),
                    stopButton.setDisabled(true),  // Thay đổi "skipButton" thành "stopButton"
                    showQueueButton.setDisabled(true),
                    clearQueueButton.setDisabled(true)
                );

            message.edit({ components: [disabledRow] })
                .catch(console.error);
        }, 180000);

        collector.on('collect', async i => {
            await i.deferUpdate();
            if (i.customId === 'loopQueue') {
                setLoop(player, 'queue');
                const loopEmbed = new EmbedBuilder()
                    .setAuthor({
                        name: 'Lặp hàng chờ!',
                        iconURL: 'https://cdn.discordapp.com/attachments/1156866389819281418/1157318080670728283/7905-repeat.gif?ex=66383bb4&is=6636ea34&hm=65f37cf88245f1c09285b547fda57b82828b3bbcda855e184f446d6ff43756b3&', 
                        url: 'https://discord.gg/xQF9f9yUEM'
                    })
                    .setColor("#00FF00")
                    .setTitle("**Đã kích hoạt lặp hàng chờ!**");

                await channel.send({ embeds: [loopEmbed] });
            } else if (i.customId === 'stopTrack') {  // Thay đổi "skipTrack" thành "stopTrack"
                player.stop();
                const stopEmbed = new EmbedBuilder()
                    .setColor('#3498db')
                    .setAuthor({
                        name: 'Đã dừng bài hát',
                        iconURL: 'https://cdn.discordapp.com/attachments/1156866389819281418/1157269773118357604/giphy.gif?ex=6517fef6&is=6516ad76&hm=f106480f7d017a07f75d543cf545bbea01e9cf53ebd42020bd3b90a14004398e&',
                        url: 'https://discord.gg/FUEHs7RCqz'
                    })
                    .setTitle("**Trình phát sẽ dừng lại!**")
                    .setTimestamp();

                await channel.send({ embeds: [stopEmbed] });
            } else if (i.customId === 'disableLoop') {
                setLoop(player, 'none');
                const loopEmbed = new EmbedBuilder()
                    .setColor("#0099ff")
                    .setAuthor({
                        name: 'Đã tắt lặp',
                        iconURL: 'https://cdn.discordapp.com/attachments/1230824451990622299/1230836684774576168/7762-verified-blue.gif?ex=6638b97d&is=663767fd&hm=021725868cbbc66f35d2b980585489f93e9fd366aa57640732dc49e7da9a80ee&', 
                        url: 'https://discord.gg/xQF9f9yUEM'
                    })
                    .setDescription('**Đã tắt lặp cho hàng chờ và bài hát đơn!**');

                await channel.send({ embeds: [loopEmbed] });
            } else if (i.customId === 'showQueue') {
                const pageSize = 10; 

                const queueMessage = queueNames.length > 0 ?
                    queueNames.map((song, index) => `${index + 1}. ${song}`).join('\n') :
                    "Hàng chờ trống.";

                const pages = [];
                for (let i = 0; i < queueNames.length; i += pageSize) {
                    const page = queueNames.slice(i, i + pageSize);
                    pages.push(page);
                }

                for (let i = 0; i < pages.length; i++) {
                    const numberedSongs = pages[i].map((song, index) => `${index + 1}. ${song}`).join('\n');

                    const queueEmbed = new EmbedBuilder()
                        .setColor("#0099ff")
                        .setTitle(`Hàng chờ hiện tại (Trang ${i + 1}/${pages.length})`)
                        .setDescription(numberedSongs);

                    await channel.send({ embeds: [queueEmbed] });
                }
            } else if (i.customId === 'clearQueue') {
                clearQueue(player);
                const queueEmbed = new EmbedBuilder()
                    .setColor("#0099ff")
                    .setAuthor({
                        name: 'Đã xóa hàng chờ',
                        iconURL: 'https://cdn.discordapp.com/attachments/1230824451990622299/1230836684774576168/7762-verified-blue.gif?ex=6638b97d&is=663767fd&hm=021725868cbbc66f35d2b980585489f93e9fd366aa57640732dc49e7da9a80ee&', 
                        url: 'https://discord.gg/xQF9f9yUEM'
                    })
                    .setDescription('**Đã xóa thành công các bài hát trong hàng chờ!**');

                await channel.send({ embeds: [queueEmbed] });
            }
        });

        collector.on('end', collected => {
            console.log(`Đã thu thập ${collected.size} tương tác.`);
        });
    });

    client.riffy.on("queueEnd", async (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        const autoplay = false;

        if (autoplay) {
            player.autoplay(player);
        } else {
            player.destroy();
            const queueEmbed = new EmbedBuilder()
                .setColor("#0099ff")
                .setDescription('**Các bài hát trong hàng chờ đã kết thúc! Bot sẽ ngắt kết nối!**');

            await channel.send({ embeds: [queueEmbed] });
        }
    });

    function setLoop(player, loopType) {
        if (loopType === "queue") {
            player.setLoop("queue");
        } else {
            player.setLoop("none");
        }
    }

    function clearQueue(player) {
        player.queue.clear();
        queueNames.length = 0; 
    }

    function showQueue(channel, queue) {
        const queueList = queue.map((track, index) => `${index + 1}. ${track.info.title}`).join('\n');
        const queueEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("Hàng chờ")
            .setDescription(queueList);
        channel.send({ embeds: [queueEmbed] });
    }

    module.exports = { initializePlayer, setLoop, clearQueue, showQueue };
}

module.exports = { initializePlayer };
