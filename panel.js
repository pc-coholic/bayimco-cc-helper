function handleRequestFinished(request) {
    request.getContent((body) => {
        if (request.request && request.request.url) {
            chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
                let url = tabs[0].url;
                if (!url.startsWith('https://intern.impfzentren.bayern/callcenter/citizen/overview/')) {
                    cleanup();
                } else {
                    let split = request.request.url.split('/')
                    if (
                        request.request.url.match('https://intern.impfzentren.bayern/api/v1/call-center/citizens/') && 
                        split[split.length -1].length == 36
                    ) {
                        processPersonData(body);
                    }
                }
            });
        }
    });
}

function processPersonData(content) {
    let data = JSON.parse(content);
    if ("uuid" in data) {
        $('#nodata').hide();
        $('#content').empty();
        $('#content').append('<div id="accordion">');
        $('#content').append(makeMetadataCard(data));
        $('#content').append(makeBooleanCard(data, 'workMedInstitution', 'Medizinische Einrichtungen'));
        $('#content').append(makeBooleanCard(data, 'workEducation', 'Kinder-/Jugendbetreuung, Schule/Hochschule'));
        $('#content').append(makeBooleanCard(data, 'workLiveCommunity', 'Erhaltung öffentliches Leben'));
        $('#content').append(makeBooleanCard(data, 'workInstitutionPublicLiving', 'Gemeinschaftseinrichtung'));
        $('#content').append(makeBooleanCard(data, 'workHighSocialContact', 'Besondere Kontaktsituation'));
        $('#content').append('</div>');
    } else {
        cleanup();
    }
}

function cleanup() {
    $('#nodata').show();
    $('#content').empty();
}

function getBooleanEmojiOrString(value) {
    return typeof(value) === 'boolean' ? getBooleanEmoji(value) : value;
}

function getBooleanEmoji(value) {
    return value ? '✔️' : '❌';
}

function makeMetadataCard(data) {
    var out = '<div class="card">';
    out += '<div class="card-header" id="metadataHeader">';
    out += '<button class="btn btn-link" data-toggle="collapse" data-target="#metadataBody" aria-expanded="true" aria-controls="metadataBody">Metadaten</button>';
    out += '</div>';
    out += '<div id="metadataBody" class="collapse show" aria-labelledby="metadataBodyHeader" data-parent="#accordion">';
    out += '<div class="card-body"><table>';

    let keys = ['uuid', 'score', 'registeredAt', 'deactivated', 'preexistingConditionsNumber', 'invited', 'invitationDate', 'contactedByCallCenter'];
    
    keys.forEach(element => {
        out += "<tr><td>" + element + ":</td><td>" + getBooleanEmojiOrString(data[element]) + "</td></tr>";
    });
    
    out += '</table></div></div>';
    
    return out;
}

function makeBooleanCard(data, set, name) {
    var out = '<div class="card">';
    out += '<div class="card-header" id="' + set + 'Header">';
    out += '<button class="btn btn-link collapsed" data-toggle="collapse" data-target="#' +  set + 'Body" aria-expanded="true" aria-controls="' +  set + 'Body">' + name + '</button>';
    out += '</div>';
    out += '<div id="' +  set + 'Body" class="collapse" aria-labelledby="' +  set + 'BodyHeader" data-parent="#accordion">';
    out += '<div class="card-body"><table>';
    
    for (const [key, value] of Object.entries(data[set])) {
        out += "<tr><td>" + key + "</td><td>" + getBooleanEmoji(value) + "</td></tr>"
    }
    
    out += '</table></div></div></div>';
    
    return out;
}



chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished);