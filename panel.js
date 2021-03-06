function handleRequestFinished(request) {
    request.getContent((body) => {
        if (request.request && request.request.url) {
            chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
                // The main browser tab might not be focussed right now (user clicked inside the Devtools last, for example),
                // so we are not acting on it.
                if (tabs.length === 0) {
                    return;
                }
                let taburl = tabs[0].url;
                // https://impfzentren.bayern/citizen/overview/AD99E6C9-7169-44DB-820C-E4F36D0A6F9E
                // https://intern.impfzentren.bayern/callcenter/citizen/overview/AD99E6C9-7169-44DB-820C-E4F36D0A6F9E
                // https://intern.impfzentren.bayern/management/citizen-overview/AD99E6C9-7169-44DB-820C-E4F36D0A6F9E
                if (!/^https:\/\/(intern.|uat.|intern-uat.)?impfzentren.bayern\/(callcenter\/|management\/)?(citizen\/overview\/|citizen-overview\/)[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/.test(taburl)) {
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
        $('#content').append('<div id="accordion"></div>');
        $('#accordion').append(makeMetadataCard(data));
        $('#accordion').append(makeBooleanCard(data, 'workMedInstitution', 'Medizinische Einrichtungen'));
        $('#accordion').append(makeBooleanCard(data, 'workEducation', 'Kinder-/Jugendbetreuung, Schule/Hochschule'));
        $('#accordion').append(makeBooleanCard(data, 'workLiveCommunity', 'Erhaltung ??ffentliches Leben'));
        $('#accordion').append(makeBooleanCard(data, 'workInstitutionPublicLiving', 'Gemeinschaftseinrichtung'));
        $('#accordion').append(makeBooleanCard(data, 'workHighSocialContact', 'Besondere Kontaktsituation'));
    } else {
        cleanup();
    }
}

function cleanup() {
    $('#nodata').show();
    $('#content').empty();
    $('#agecalcResult').empty();
    $('#agecalcBirthday').val('');
}

function getBooleanEmojiOrString(value) {
    return typeof(value) === 'boolean' ? getBooleanEmoji(value) : value;
}

function getBooleanEmoji(value) {
    return value ? '??????' : '???';
}

function makeMetadataCard(data) {
    let out = '<div class="card">';
    out += '<div class="card-header" id="metadataHeader">';
    out += '<button class="btn" data-toggle="collapse" data-target="#metadataBody" aria-expanded="true" aria-controls="metadataBody">Metadaten</button>';
    out += '</div>';
    out += '<div id="metadataBody" class="collapse show" aria-labelledby="metadataHeader" data-parent="#accordion">';
    out += '<div class="card-body"><table>';

    let keys = ['priority', 'birthday', 'age', 'score', 'registeredAt', 'deactivated', 'preexistingConditionsNumber', 'invited', 'invitationDate', 'contactedByCallCenter'];
    let datetimekeys = ['registeredAt', 'invitationDate'];
    let datekeys = ['birthday'];

    keys.forEach(key => {
        if (key === "birthday") {
            let age = data['age'] = parseInt(
                Math.abs(new Date(Date.now() - new Date(data[key]).getTime()).getUTCFullYear() - 1970)
            );

            if (age < 18) {
                data['age'] += ' <span class="badge bg-danger">U18</span>';
            }
            if ('firstVaccinationVaccine' in data && data['firstVaccinationVaccine']['id'] === '002') {
                if (age < 60) {
                    data['age'] += ' <span class="badge bg-success">AZ -> mRNA: ??????</span>';
                } else {
                    data['age'] += ' <span class="badge bg-warning">AZ -> mRNA: ??????</span>';
                }
            }
        }

        if (datetimekeys.includes(key)) {
            data[key] = new Date(data[key]).toLocaleString('de');
        }

        if (datekeys.includes(key)) {
            data[key] = new Date(data[key]).toLocaleDateString('de');
        }

        out += "<tr><td>" + key + "</td><td>" + getBooleanEmojiOrString(data[key]) + "</td></tr>";
    });
    
    out += '</table></div></div>';
    
    return out;
}

function makeBooleanCard(data, set, name) {
    let out = '';
    let items = '';
    let count = 0;

    for (const [key, value] of Object.entries(data[set])) {
        items += "<tr><td>" + key + "</td><td>" + getBooleanEmoji(value) + "</td></tr>"
        if (value) {
            count++;
        }
    }

    out += '<div class="card">';
    out += '<div class="card-header" id="' + set + 'Header">';
    out += '<button class="btn collapsed" data-toggle="collapse" data-target="#' +  set + 'Body" aria-expanded="false" aria-controls="' +  set + 'Body">';
    if (count > 0) {
        out += name + ' <span class="badge bg-secondary">' + count + '</span>';
    } else {
        out += name;
    }
    out += '</button>';
    out += '</div>';
    out += '<div id="' +  set + 'Body" class="collapse" aria-labelledby="' +  set + 'Header" data-parent="#accordion">';
    out += '<div class="card-body"><table>';
    out += items
    out += '</table></div></div></div>';
    
    return out;
}

function spell(word, scheme) {
    let words = []

    switch (scheme) {
        case 'de':
            words = [
                'Anton', 'Berta', 'C??sar', 'Dora', 'Emil', 'Friedrich', 'Gustav', 'Heinrich', 'Ida', 'Julius',
                'Kaufmann', 'Ludwig', 'Martha', 'Nordpol', 'Otto', 'Paula', 'Quelle', 'Richard', 'Samuel', 'Theodor',
                'Ulrich', 'Viktor', 'Wilhelm', 'Xanthippe', 'Ypsilon', 'Zacharias'
            ];
            break;
        case 'en':
            words =  [
                'Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrott', 'Golf', 'Hotel', 'India', 'Juliett', 'Kilo',
                'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Qu??bec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor',
                'Whiskey', 'X-Ray', 'Yankee', 'Zulu'
            ];
            break;
    }

    let chars = 'abcdefghijklmnopqrstuvwxyz';

    let out = [];
    word = word.toLowerCase();
    for (let i = 0; i < word.length; i++) {
        switch (word[i]) {
            case '??':
                out.push('Eszett');
                break;
            case '??':
                out.push('??konom');
                break;
            case '??':
                out.push('??bermut');
                break;
            case '??':
                out.push('??rger');
                break;
            default:
                if (chars.includes(word[i])) {
                    out.push(words[chars.indexOf(word[i])]);
                } else {
                    out.push(word[i]);
                }
                break;
        }
    }

    return out.join(' / ');
}

$(function() {
    $('[name=spellingScheme]').change(function() {
        $('#spellingResult').html(spell($('#spellingWord').val(), $('[name=spellingScheme]:checked').val()));
    });

    $('#spellingWord').keyup(function() {
       $('#spellingResult').html(spell($('#spellingWord').val(), $('[name=spellingScheme]:checked').val()));
    });

    $('#izsearchZIP').keyup(function() {
        if ($(this).val().length !== 5) {
            $('#izsearchResult').empty();
        } else {
            // ToDo: CORS issue...
            $.getJSON('https://impfzentren.bayern/api/v1/centers/byZip?zip=' + $(this).val(), function (data ) {});
        }
    });

    $('#agecalcBirthday').keyup(function() {
        let age = parseInt(Math.abs(new Date(Date.now() - new Date($(this).val()).getTime()).getUTCFullYear() - 1970));
        if (isNaN(age)) {
            $('#agecalcResult').empty();
        } else {
            $('#agecalcResult').html(age);
        }
    });
});

chrome.devtools.network.onRequestFinished.addListener(handleRequestFinished);
