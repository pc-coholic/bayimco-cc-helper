function handleRequestFinished(request) {
    request.getContent((body) => {
        if (request.request && request.request.url) {
            chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
                let taburl = tabs[0].url;
                // https://impfzentren.bayern/citizen/overview/AD99E6C9-7169-44DB-820C-E4F36D0A6F9E
                // https://intern.impfzentren.bayern/callcenter/citizen/overview/AD99E6C9-7169-44DB-820C-E4F36D0A6F9E
                if (!/^https:\/\/(intern.|uat.|intern-uat.)?impfzentren.bayern\/(callcenter\/)?citizen\/overview\/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/.test(taburl)) {
                    cleanup();
                } else {
                    // https://impfzentren.bayern/api/v1/citizens/AD99E6C9-7169-44DB-820C-E4F36D0A6F9E
                    // https://impfzentren.bayern/api/v1/call-center/citizens/AD99E6C9-7169-44DB-820C-E4F36D0A6F9E
                    if (/^https:\/\/(intern.|uat.|intern-uat.)?impfzentren.bayern\/api\/v1\/(call-center\/)?citizens\/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/.test(request.request.url)) {
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
    out += '<button class="btn" data-toggle="collapse" data-target="#metadataBody" aria-expanded="true" aria-controls="metadataBody">Metadaten</button>';
    out += '</div>';
    out += '<div id="metadataBody" class="collapse show" aria-labelledby="metadataBodyHeader" data-parent="#accordion">';
    out += '<div class="card-body"><table>';

    let keys = ['score', 'registeredAt', 'deactivated', 'preexistingConditionsNumber', 'invited', 'invitationDate', 'contactedByCallCenter'];
    
    keys.forEach(element => {
        out += "<tr><td>" + element + ":</td><td>" + getBooleanEmojiOrString(data[element]) + "</td></tr>";
    });
    
    out += '</table></div></div>';
    
    return out;
}

function makeBooleanCard(data, set, name) {
    var out = '<div class="card">';
    out += '<div class="card-header" id="' + set + 'Header">';
    out += '<button class="btn collapsed" data-toggle="collapse" data-target="#' +  set + 'Body" aria-expanded="true" aria-controls="' +  set + 'Body">' + name + '</button>';
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