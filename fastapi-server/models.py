from sqlalchemy import (
    Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP, JSON, UniqueConstraint, Float, CheckConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Organization(Base):
    __tablename__ = 'organizations'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, unique=True, nullable=False)
    description = Column(Text)
    contact_email = Column(Text)
    contact_phone = Column(Text)
    created_at = Column(TIMESTAMP)
    settings = Column(JSON)
    logo_url = Column(Text)
    is_active = Column(Boolean, default=True)

    users = relationship('User', back_populates='organization')
    groups = relationship('Group', back_populates='organization')

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False)
    username = Column(Text, nullable=False)
    password = Column(Text, nullable=False)
    name = Column(Text)
    email = Column(Text)
    department = Column(Text)
    role = Column(String, CheckConstraint("role IN ('admin', 'viewer', 'editor', 'agent')"), nullable=False)
    avatar_color = Column(Text)
    status = Column(Text)
    last_active = Column(TIMESTAMP)
    is_agent = Column(Boolean, default=False)

    __table_args__ = (UniqueConstraint('organization_id', 'username', name='uq_org_username'),)

    organization = relationship('Organization', back_populates='users')
    user_groups = relationship('UserGroup', back_populates='user')

class Group(Base):
    __tablename__ = 'groups'
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text)

    __table_args__ = (UniqueConstraint('organization_id', 'name', name='uq_org_groupname'),)

    organization = relationship('Organization', back_populates='groups')
    user_groups = relationship('UserGroup', back_populates='group')
    group_viewers = relationship('GroupViewer', back_populates='group')

class UserGroup(Base):
    __tablename__ = 'user_groups'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    group_id = Column(Integer, ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'group_id', name='uq_user_group'),
        UniqueConstraint('organization_id', 'user_id', 'group_id', name='uq_org_user_group'),
    )

    user = relationship('User', back_populates='user_groups')
    group = relationship('Group', back_populates='user_groups')

class GroupViewer(Base):
    __tablename__ = 'group_viewers'
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey('groups.id', ondelete='CASCADE'), nullable=False)
    viewer_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False)

    __table_args__ = (
        UniqueConstraint('group_id', 'viewer_id', name='uq_group_viewer'),
        UniqueConstraint('organization_id', 'group_id', 'viewer_id', name='uq_org_group_viewer'),
    )

    group = relationship('Group', back_populates='group_viewers')

class AgentConfig(Base):
    __tablename__ = 'agent_configs'
    agent_id = Column(Integer, primary_key=True, autoincrement=True, index=True)  # Integer PK
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    machine_info = Column(JSON)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)
    __table_args__ = (UniqueConstraint('organization_id', 'agent_id', name='uq_org_agentid'),)

class AgentStatus(Base):
    __tablename__ = 'agent_status'
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    agent_id = Column(Integer, ForeignKey('agent_configs.agent_id', ondelete='SET NULL'))  # Integer FK
    timestamp = Column(TIMESTAMP)
    version = Column(Text)
    platform = Column(Text)
    is_running = Column(Boolean)
    is_connected = Column(Boolean)
    last_activity_time = Column(TIMESTAMP)
    cpu_usage = Column(Float)
    memory_usage = Column(Float)
    disk_space = Column(Float)

class Screenshot(Base):
    __tablename__ = 'screenshots'
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    group_id = Column(Integer, ForeignKey('groups.id', ondelete='SET NULL'))
    agent_id = Column(Integer, ForeignKey('agent_configs.agent_id', ondelete='SET NULL'))  # Integer FK
    timestamp = Column(TIMESTAMP)
    image_data = Column(Text)
    application = Column(Text)
    website = Column(Text)
    title = Column(Text)

class AppWebsiteRule(Base):
    __tablename__ = 'app_website_rules'
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False)
    type = Column(String, CheckConstraint("type IN ('application', 'website')"), nullable=False)
    pattern = Column(Text, nullable=False)
    category = Column(String, CheckConstraint("category IN ('productive', 'unproductive', 'uncategorized')"), nullable=False, default='uncategorized')
    description = Column(Text)

    __table_args__ = (UniqueConstraint('organization_id', 'type', 'pattern', name='uq_org_type_pattern'),) 