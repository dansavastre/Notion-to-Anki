import PySimpleGUI as sg
import os

import json
import urllib.request


def request(action, **params):
    return {'action': action, 'params': params, 'version': 6}


def invoke(action, **params):
    requestJson = json.dumps(request(action, **params)).encode('utf-8')
    response = json.load(urllib.request.urlopen(urllib.request.Request('http://localhost:8765', requestJson)))
    if len(response) != 2:
        raise Exception('response has an unexpected number of fields')
    if 'error' not in response:
        raise Exception('response is missing required error field')
    if 'result' not in response:
        raise Exception('response is missing required result field')
    if response['error'] is not None:
        raise Exception(response['error'])
    return response['result']


def process_files(files):
    deck_name = values['deck_name']

    number = 10
    sg.popup("Added " + str(number) + " flashcards to: " + deck_name + '\n' + "Files: ", files)

    # create the deck if it doesn't already exist
    deck_names = invoke('deckNames')
    if deck_name not in deck_names:
        invoke('createDeck', deck=deck_name)
        print("Created deck " + deck_name)
    else:
        # retrieve all existing notes in the deck
        print("Deck already exists")
        print("Getting cards in deck")
        note_ids = invoke('findNotes', query='deck:"' + deck_name + '"')
        existing_questions = set()
        for note_id in note_ids:
            note = invoke('notesInfo', notes=[note_id])[0]
            existing_questions.add(note['fields']['Front']['value'])
        print(existing_questions)

    # Go through the files and add process them
    for file in files:
        # open the file and read the lines
        number_of_notes = 0
        with open(file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            note = {}
            ans = ''
            for line in lines:
                prefix_question = "- "
                prefix_answer = "    - "

                if line.startswith(prefix_answer):
                    # Add answer to the answers of the current question
                    line = line.replace(prefix_answer, ' - ')
                    ans += line + "<br>"

                elif line.startswith(prefix_question):
                    line = line.replace(prefix_question, '')
                    # Save previous question
                    if (note):
                        note['fields']['Back'] = ans
                        invoke('addNote', note=note)
                        number_of_notes += 1
                        # print(note)
                    # Create new card
                    ans = ''
                    note = {
                        'deckName': deck_name,
                        'modelName': 'Basic',
                        'fields': {
                            'Front': line,
                            'Back': ''
                        },
                        'options': {
                            'allowDuplicate': False,
                        },
                        'tags': []
                    }
                else:
                    continue

            if (note):
                note['fields']['Back'] = ans
                invoke('addNote', note=note)
                number_of_notes += 1
    print("Notes created: " + str(number_of_notes))
    sg.popup("Added " + str(number_of_notes) + " flashcards to: " + deck_name + '\n' + "Files: ", files)

layout = [
    [sg.Text('Folder:'), sg.InputText(enable_events=True, key='-FOLDER-'), sg.FolderBrowse()],
    [sg.Listbox(values=[], enable_events=True, size=(40, 20), select_mode=sg.LISTBOX_SELECT_MODE_MULTIPLE,
                key='-FILES-')],
    [sg.Text('Enter deck name:'), sg.InputText(key='deck_name')],
    [sg.Button('Process')]
]

window = sg.Window('File Browser', layout)

while True:
    event, values = window.read()

    if event == sg.WINDOW_CLOSED:
        break
    elif event == '-FOLDER-':
        folder = values['-FOLDER-']
        try:
            # List files in the selected folder
            file_list = os.listdir(folder)
            window['-FILES-'].update(file_list)
        except:
            pass
    elif event == 'Process':
        selected_files = values['-FILES-']
        # Add the folder name to the selected files for full paths
        full_paths = [os.path.join(values['-FOLDER-'], file) for file in selected_files]
        process_files(full_paths)

window.close()
