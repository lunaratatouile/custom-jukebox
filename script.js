const wantedCharacters = 'a-zA-Z0-9 ';
const unwantedCharactersPattern = new RegExp(`[^${wantedCharacters}]`, 'g');
//Default Image Preview
document.addEventListener('DOMContentLoaded', function() {
    // Show default image when the page loads
    const defaultImagePath = 'default_jukebox_pack_image.png'; // Adjust path as needed
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.style.backgroundImage = 'url(' + defaultImagePath + ')';
    const uploadText = imagePreview.querySelector('.upload-text');
    if (uploadText) {
        uploadText.style.display = 'block'; // Show the upload text
    }
});
// Function to show image preview
function showImage(event, elementId, hideText) {
    const input = event.target;
    // console.log(input)
    const reader = new FileReader();
    reader.onload = function() {
        const imagePreview = document.getElementById(elementId);
        imagePreview.style.backgroundImage = 'url(' + reader.result + ')';
        const uploadText = imagePreview.querySelector('.upload-text');
        if (uploadText && hideText) {
            uploadText.style.display = 'none'; // Hide the upload text
        }
    }
    reader.readAsDataURL(input.files[0]);
}

// Function to update label text with selected file name
function updateButtonLabel(event) {
    const fileInput = event.target;
    const fileName = fileInput.files[0].name;
    const uploadLabel = fileInput.nextElementSibling; // Assuming label is next sibling
    uploadLabel.textContent = fileName;
}

function removeMusicDisc(button) {
    // Get the parent element (music-disc-input-div) of the button clicked
    const musicDiscDiv = button.parentNode;
    
    // Remove the music-disc-input-div from its parent container
    musicDiscDiv.parentNode.removeChild(musicDiscDiv);
}

// Function to add new music-disc-input-div
function addMusicDisc() {
    const musicDiscContainer = document.getElementById('musicDiscContainer');

    // Create a new music-disc-input-div element
    const newMusicDisc = document.createElement('div');
    newMusicDisc.classList.add('music-disc-input-div');

    // Add inner HTML for the new music-disc-input-div
    newMusicDisc.innerHTML = `
        <div class="input-group">
            <label for="name">Enter Name:</label>
            <input type="text" id="name" name="name">
        </div>
        <div class="input-group">
            <label for="author">Enter Author Name:</label>
            <input type="text" id="author" name="author">
        </div>
        <div class="input-group">
            <input type="file" class="file-input" name="file" accept="audio/ogg" style="display: none;">
            <label class="upload-label">Upload File</label>
        </div>
        <button class="remove-button" onclick="removeMusicDisc(this)">Remove</button>
    `;


    // Append the new music-disc-input-div to the container
    musicDiscContainer.appendChild(newMusicDisc);

    // Attach event listener for file input to new music-disc-input-div
    const newFileInput = newMusicDisc.querySelector('.file-input');
    const newUploadLabel = newMusicDisc.querySelector('.upload-label');
    
    newFileInput.addEventListener('change', updateButtonLabel);
    newUploadLabel.addEventListener('click', () => {
        newFileInput.click();
    });

}
//Remove file extension
function removeFileExtension(fileName) {
    // Find the last dot (.) in the string
    const lastDotIndex = fileName.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
        // If there's no dot in the fileName, return the fileName as is
        return fileName;
    } else {
        // Otherwise, return the part of the fileName up to the last dot
        return fileName.substring(0, lastDotIndex);
    }
}

//Get Audio Duration
function getAudioDuration(soundFile) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(URL.createObjectURL(soundFile));
        // console.log(audio)
        audio.addEventListener('loadedmetadata', function() {
            const duration = audio.duration;
            resolve(duration);
        });

        audio.addEventListener('error', function(e) {
            reject(e);
        });
    });
}

function createMcFunction(zip,name){
    const textContent = `#give ${name} to player\ngive @s minecraft:music_disc_13[minecraft:jukebox_playable={song:"new_music:${name}"}]`;
    zip.file(`data/new_music/function/${name}.mcfunction`, textContent);
}

// Function to handle music disc inputs and create JSON data
async function createMusicDiscJson(zip) {
    const musicDiscInputs = document.querySelectorAll('.music-disc-input-div input[type="file"]');
    const musicDiscTextInputs = document.querySelectorAll('.music-disc-input-div input[type="text"]');
    const filePromises = [];
    const musicDiscData = {}; // Object to hold music disc data

    for (let i = 0; i < musicDiscTextInputs.length; i += 2) {
        const name = musicDiscTextInputs[i].value;
        const author = musicDiscTextInputs[i + 1].value;
        var soundFile = musicDiscInputs[i / 2].files[0];
        const cleanedInput = name.toLowerCase().replace(unwantedCharactersPattern, '_');
        const cleanedName = cleanedInput.replace(/ /g, '_');

        try {
            // Wait for audio duration retrieval
            const duration = await getAudioDuration(soundFile);
            // console.log('Duration:', duration, 'seconds');

            const musicDataJSON = {
                comparator_output: 1,
                description: author.concat(' - ', name),
                length_in_seconds: duration, // Assign the retrieved duration here
                sound_event: {
                    sound_id: `minecraft:music_disc.${cleanedName}`
                }
            };
            // console.log(cleanedName)
            zip.file(`data/new_music/jukebox_song/${cleanedName}.json`, JSON.stringify(musicDataJSON, null, 2));
        } catch (error) {
            console.error('Error while loading audio:', error);
            // Handle error as needed
        }

        try {
            //wait for function creation
            await createMcFunction(zip,cleanedName)
        } catch (error) {
            console.error('Error while loading audio:', error);
            // Handle error as needed
        }
    }

    // Processing other file inputs (sounds)
    musicDiscInputs.forEach((fileInput, index) => {
        const file = fileInput.files[0];
        if (file) {
            const musicDiscPromise = new Promise((innerResolve, innerReject) => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Add sound file directory to the json
                    const nameUsed = removeFileExtension(file.name).toLowerCase().replace(/ /g, '_').replace(unwantedCharactersPattern, '_');
                    const soundData = {
                        name: `records/music_disc_${index + 1}_${nameUsed}`,
                        stream: true
                    };
                    // sounds.json name
                    const musicDiscName = `music_disc.${musicDiscTextInputs[index * 2].value.toLowerCase().replace(unwantedCharactersPattern, '_').replace(/ /g, '_')}`;
                    if (!musicDiscData[musicDiscName]) {
                        musicDiscData[musicDiscName] = { sounds: [] };
                    }
                    musicDiscData[musicDiscName].sounds.push(soundData);

                    // Add file to ZIP
                    zip.file(`assets/minecraft/sounds/records/music_disc_${index + 1}_${nameUsed}.ogg`, event.target.result.split(',')[1], { base64: true });

                    innerResolve();
                };
                reader.readAsDataURL(file);
            });
            filePromises.push(musicDiscPromise);
        }
    });

    // Wait for all file promises to resolve
    await Promise.all(filePromises);

    // Convert music disc data object to JSON string
    const musicDiscDataJson = JSON.stringify(musicDiscData, null, 2);

    // Add JSON file to ZIP
    zip.file('assets/minecraft/sounds.json', musicDiscDataJson);
}


// Function to create main pack JSON data
function createPackJson() {
    const packVersion = parseInt(document.getElementById('packVersion').value, 10);
    const packDescription = document.getElementById('packDescription').value;
    const jsonData = 
    {
        pack: {
          pack_format: packVersion,
          supported_formats: [34, 45],
          description: packDescription.replace(/\\n/g, '\n')
        },
        overlays: {
            entries: [
                {
                    formats: {min_inclusive: 18, max_inclusive: 2147483647},
                    directory: "overlay_18"
                }
            ]
        }
    }

    return jsonData;
}

// Event listener for download button
document.getElementById('downloadDataButton').addEventListener('click', async function() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block'; // Show loader

    const packName = document.getElementById('packName').value;
    const packImageFileInput = document.getElementById('image');
    const packImage = packImageFileInput.files[0];
    const zip = new JSZip();

    // Create pack data JSON
    const packJson = createPackJson();
    zip.file("pack.mcmeta", JSON.stringify(packJson, null, 2));

    try {
        if (packImage) {
            zip.file('pack.png', packImage, { base64: true });
        } else {
            const response = await fetch("default_jukebox_pack_image.png");
            const arrayBuffer = await response.arrayBuffer();
            zip.file('pack.png', arrayBuffer);
        }

        // Create music disc data JSON and add to zip
        await createMusicDiscJson(zip);

        // Generate and download ZIP file
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${packName}.zip`;
        link.click();
    } catch (error) {
        console.error('Error generating ZIP file:', error);
        // Handle error appropriately
    } finally {
        loader.style.display = 'none'; // Hide loader
    }
});

// ----------- AJOUT IMPORT PACK -----------

document.getElementById('importPackButton').addEventListener('click', () => {
    document.getElementById('importPackInput').click();
});

document.getElementById('importPackInput').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    try {
        const zip = await JSZip.loadAsync(file);

        // 1. pack.mcmeta
        const mcmeta = await zip.file('pack.mcmeta').async('string');
        const meta = JSON.parse(mcmeta);
        document.getElementById('packName').value = file.name.replace(/\.zip$/, '');
        document.getElementById('packVersion').value = meta.pack.pack_format;
        document.getElementById('packDescription').value = meta.pack.description.replace(/\n/g, '\\n');

        // 2. pack.png
        if (zip.file('pack.png')) {
            const imgData = await zip.file('pack.png').async('base64');
            const imagePreview = document.getElementById('imagePreview');
            imagePreview.style.backgroundImage = `url(data:image/png;base64,${imgData})`;
            const uploadText = imagePreview.querySelector('.upload-text');
            if (uploadText) uploadText.style.display = 'none';
        }

        // 3. assets/minecraft/sounds.json
        const soundsJson = await zip.file('assets/minecraft/sounds.json').async('string');
        const sounds = JSON.parse(soundsJson);

        // 4. data/new_music/jukebox_song/*.json
        const songFiles = [];
        zip.folder('data/new_music/jukebox_song').forEach((relPath, fileObj) => {
            songFiles.push(relPath);
        });

        // Nettoie l’UI
        document.getElementById('musicDiscContainer').innerHTML = '';

        // Pour chaque musique, on reconstruit l’UI
        for (const songFile of songFiles) {
            const songJson = await zip.file('data/new_music/jukebox_song/' + songFile).async('string');
            const song = JSON.parse(songJson);
            // Récupère le nom et l’auteur
            const [author, name] = (song.description || '').split(' - ');
            // Récupère le nom du son dans sounds.json
            const soundKey = Object.keys(sounds).find(k => k.endsWith(removeFileExtension(songFile)));
            let oggFile = null;
            if (soundKey && sounds[soundKey].sounds && sounds[soundKey].sounds[0]) {
                const oggPath = 'assets/minecraft/sounds/' + sounds[soundKey].sounds[0].name + '.ogg';
                if (zip.file(oggPath)) {
                    oggFile = await zip.file(oggPath).async('blob');
                }
            }

            // Ajoute l’UI
            const musicDiscContainer = document.getElementById('musicDiscContainer');
            const newMusicDisc = document.createElement('div');
            newMusicDisc.classList.add('music-disc-input-div');
            newMusicDisc.innerHTML = `
                <div class="input-group">
                    <label for="name">Enter Name:</label>
                    <input type="text" id="name" name="name" value="${name ? name : ''}">
                </div>
                <div class="input-group">
                    <label for="author">Enter Author Name:</label>
                    <input type="text" id="author" name="author" value="${author ? author : ''}">
                </div>
                <div class="input-group">
                    <input type="file" class="file-input" name="file" accept="audio/ogg" style="display: none;">
                    <label class="upload-label">${oggFile ? 'Fichier chargé' : 'Upload File'}</label>
                </div>
                <button class="remove-button" onclick="removeMusicDisc(this)">Remove</button>
            `;
            musicDiscContainer.appendChild(newMusicDisc);

            // Si on a le fichier ogg, on le met dans l’input file (hack)
            if (oggFile) {
                const fileInput = newMusicDisc.querySelector('.file-input');
                // On ne peut pas mettre un File dans un input type="file" en JS (limite navigateur)
                // Donc on stocke le fichier dans un attribut pour l’utiliser lors du download
                fileInput._importedFile = new File([oggFile], sounds[soundKey].sounds[0].name.split('/').pop() + '.ogg', {type: 'audio/ogg'});
                // On change le label
                newMusicDisc.querySelector('.upload-label').textContent = fileInput._importedFile.name;
            }

            // Ajoute les listeners
            const newFileInput = newMusicDisc.querySelector('.file-input');
            const newUploadLabel = newMusicDisc.querySelector('.upload-label');
            newFileInput.addEventListener('change', updateButtonLabel);
            newUploadLabel.addEventListener('click', () => {
                newFileInput.click();
            });
        }
    } catch (e) {
        alert("Erreur lors de l'import : " + e);
    } finally {
        loader.style.display = 'none';
    }
});

// Patch pour que createMusicDiscJson prenne en compte les fichiers importés
const originalCreateMusicDiscJson = createMusicDiscJson;
createMusicDiscJson = async function(zip) {
    const musicDiscInputs = document.querySelectorAll('.music-disc-input-div input[type="file"]');
    musicDiscInputs.forEach(input => {
        if (!input.files.length && input._importedFile) {
            // Hack pour que FileList soit utilisable
            const dt = new DataTransfer();
            dt.items.add(input._importedFile);
            input.files = dt.files;
        }
    });
    return originalCreateMusicDiscJson(zip);
};
