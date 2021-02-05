import json
import os
from json.decoder import JSONDecodeError

from aiohttp import web
from aiohttp.http_websocket import WSMsgType
from dotenv import load_dotenv
from pyrogram import Client
from pyrogram.raw.functions.channels import GetFullChannel
from pyrogram.raw.functions.phone import GetGroupParticipants
from pyrogram.raw.functions.phone import JoinGroupCall
from pyrogram.raw.types import DataJSON

load_dotenv()

client = Client(
    "session", os.environ["API_ID"], os.environ["API_HASH"],
)
client.start()


async def join_call(data):
    chat = await client.send(
        GetFullChannel(
            channel=await client.resolve_peer(
                data["chat"]["id"]
            )
        )
    )

    result = await client.send(
        JoinGroupCall(
            call=chat.full_chat.call,
            muted=False,
            params=DataJSON(
                data=json.dumps({
                    "ufrag": data["ufrag"],
                    "pwd": data["pwd"],
                    "fingerprints": [{
                        "hash": data["hash"],
                        "setup": data["setup"],
                        "fingerprint": data["fingerprint"],
                    }],
                    "ssrc": data["source"],
                }),
            ),
        ),
    )

    transport = json.loads(result.updates[0].call.params.data)["transport"]

    return {
        "_": "get_join",
        "data": {
            "chat_id": data["chat"]["id"],
            "transport": {
                "ufrag": transport["ufrag"],
                "pwd": transport["pwd"],
                "fingerprints": transport["fingerprints"],
                "candidates": transport["candidates"],
            },
        },
    }


async def get_participants(data):
    chat = await client.send(
        GetFullChannel(
            channel=await client.resolve_peer(
                data["chat"]["id"]
            )
        )
    )

    participants = await client.send(
        GetGroupParticipants(
            call=chat.full_chat.call,
            ids=[],
            sources=[],
            offset="",
            limit=5000,
        ),
    )

    return {
        "_": "get_participants",
        "data": [
            {"source": x.source, "user_id": x.user_id}
            for x in participants.participants
        ],
    }


async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == WSMsgType.TEXT:
            print(msg.data)
            try:
                data = json.loads(msg.data)
            except JSONDecodeError:
                await ws.close()
                break

            response = None
            if data["_"] == "join":
                response = await join_call(data["data"])
            elif data["_"] == "get_participants":
                response = await get_participants(data["data"])

            if response is not None:
                await ws.send_json(response)

    return ws


def main():
    app = web.Application()
    app.router.add_route("GET", "/", websocket_handler)
    web.run_app(app, port=1390)


if __name__ == "__main__":
    main()
