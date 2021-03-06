"use strict";
const DataType = require("node-opcua-variant").DataType;
const StatusCodes = require("node-opcua-status-code").StatusCodes;
const assert = require("node-opcua-assert").assert;

function add_eventGeneratorObject(namespace, parentFolder) {

    const myEvtType = namespace.addEventType({
        browseName: "MyEventType",
        subtypeOf: "BaseEventType" // should be implicit
    });


    const myObject = namespace.addObject({
        organizedBy: parentFolder,
        browseName: "EventGeneratorObject"
    });

    myObject.addReference({referenceType: "AlwaysGeneratesEvent", nodeId: myEvtType});

    const method = namespace.addMethod(myObject, {
        browseName: "EventGeneratorMethod",
        inputArguments: [
            {
                name: "message",
                description: {text: "Event Message"},
                dataType: DataType.String
            },
            {
                name: "severity",
                description: {text: "Event Severity"},
                dataType: DataType.UInt32
            }
        ],
        outputArguments: []
    });

    method.bindMethod(function (inputArguments, context, callback) {

        //xx console.log("In Event Generator Method");
        //xx console.log(this.toString());
        //xx console.log(context.object.toString());

        //xx console.log("inputArguments ", inputArguments[0].toString());

        const message = inputArguments[0].value || "Hello from Event Generator Object";
        const severity = inputArguments[1].value || 0;

        const myEventType = namespace.addressSpace.findEventType("MyEventType",namespace.index);
        context.object.raiseEvent(myEventType, {
            message: {
                dataType: DataType.LocalizedText,
                value: {text: message}
            },
            severity: {
                dataType: DataType.UInt32,
                value: severity
            }

        });
        // console.log(require("util").inspect(context).toString());
        const callMethodResult = {
            statusCode: StatusCodes.Good,
            outputArguments: []
        };
        callback(null, callMethodResult);
    });

}
exports.add_eventGeneratorObject = add_eventGeneratorObject;
